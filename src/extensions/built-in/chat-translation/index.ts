import type { ExtensionAPI, ChatMessage } from '@/types';
import { manifest } from './manifest';
import SettingsPanel from './SettingsPanel.vue';
import { Translator } from './translator';
import { AutoTranslateMode } from './types';

export { manifest };

export function activate(api: ExtensionAPI) {
  const translator = new Translator(api);
  let settingsApp: any = null;

  const settingsContainer = document.getElementById(api.meta.containerId);
  if (settingsContainer) {
    settingsApp = api.ui.mount(settingsContainer, SettingsPanel, { api });
  }

  const injectSingleButton = (messageElement: HTMLElement, messageIndex: number) => {
    const buttonsContainer = messageElement.querySelector('.message__buttons');
    if (!buttonsContainer) return;

    if (buttonsContainer.querySelector('.translation-button')) return;

    const btn = document.createElement('i');
    btn.className = 'message__button fa-solid fa-globe translation-button';
    btn.title = 'Translate Message';
    btn.style.cursor = 'pointer';

    btn.onclick = (e) => {
      e.stopPropagation();
      translator.translateMessage(messageIndex);
    };

    buttonsContainer.appendChild(btn);
  };

  const injectButtons = () => {
    const messageElements = document.querySelectorAll('.message');

    messageElements.forEach((el) => {
      const indexAttr = el.getAttribute('data-message-index');
      if (indexAttr === null) return;
      const messageIndex = parseInt(indexAttr, 10);
      if (isNaN(messageIndex)) return;
      injectSingleButton(el as HTMLElement, messageIndex);
    });
  };

  const unbinds: Array<() => void> = [];

  unbinds.push(api.events.on('chat:entered', injectButtons));

  // Listen for new messages for Injection AND Auto-Translation
  unbinds.push(
    api.events.on('message:created', (message: ChatMessage) => {
      const messageIndex = api.chat.getHistory().length - 1;
      const messageElements = document.querySelector(`.message[data-message-index="${messageIndex}"]`);
      if (messageElements) {
        injectSingleButton(messageElements as HTMLElement, messageIndex);
      } else {
        api.ui.showToast('Translation button injection failed: Message element not found', 'error');
      }

      const settings = api.settings.get('settings');
      if (!settings || settings.autoMode === AutoTranslateMode.NONE) return;

      const isSystem = message.is_system;
      const isUser = message.is_user;

      let shouldTranslate = false;

      switch (settings.autoMode) {
        case AutoTranslateMode.RESPONSES:
          shouldTranslate = !isSystem && !isUser;
          break;
        case AutoTranslateMode.INPUTS:
          shouldTranslate = !isSystem && !!isUser;
          break;
        case AutoTranslateMode.BOTH:
          shouldTranslate = !isSystem;
          break;
      }

      if (shouldTranslate) {
        translator.translateMessage(messageIndex); // fire and forget
      }
    }),
  );

  // Initial Injection
  injectButtons();

  return () => {
    if (settingsApp) settingsApp.unmount();
    unbinds.forEach((u) => u());
    // Remove buttons
    document.querySelectorAll('.translation-button').forEach((el) => el.remove());
  };
}
