import i18n from '../../../i18n';
import type { ChatMetadata, ExtensionAPI, FullChat } from '../../../types';
import { MountableComponent } from '../../../types/ExtensionAPI';
import { manifest } from './manifest';

export { manifest };

export function activate(api: ExtensionAPI) {
  const { ui, chat, events, character } = api;

  // @ts-expect-error 'i18n.global' is of type 'unknown'
  const t = i18n.global.t as StrictT;

  const branchChat = async (messageIndex: number) => {
    const history = chat.getHistory();
    const metadata = chat.metadata.get();

    if (!metadata || messageIndex < 0 || messageIndex >= history.length) return;

    try {
      // 1. Prepare new metadata
      const newMetadata = structuredClone(metadata) as ChatMetadata;
      newMetadata.name = newMetadata.name ? `${newMetadata.name} (Branch)` : 'Branch';
      // Generate new integrity using UUID
      newMetadata.integrity = api.uuid();

      // 2. Slice messages
      const newMessages = history.slice(0, messageIndex + 1);

      // 3. Create FullChat object
      const fullChat: FullChat = [{ chat_metadata: newMetadata }, ...newMessages];

      // 4. Create chat via API
      const newFilename = await chat.create(fullChat);

      // 5. Update character links (if members exist)
      if (newMetadata.members) {
        for (const avatar of newMetadata.members) {
          await character.update(avatar, { chat: newFilename });
        }
      }

      // 6. Load new chat
      await chat.load(newFilename);
    } catch (error) {
      console.error('Branching failed', error);
      ui.showToast('Failed to create branch', 'error');
    }
  };

  const injectButton = async (messageElement: HTMLElement, messageIndex: number) => {
    const buttonsContainer = messageElement.querySelector('.message-buttons');
    if (!buttonsContainer || buttonsContainer.querySelector('.branch-button-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'branch-button-wrapper';
    wrapper.style.display = 'inline-flex';

    // Append to the buttons container
    buttonsContainer.appendChild(wrapper);

    await ui.mountComponent(wrapper, MountableComponent.Button, {
      icon: 'fa-code-branch',
      title: t('extensionsBuiltin.chatBranching.branchButtonTitle', 'Branch from this message'),
      variant: 'ghost',
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        branchChat(messageIndex);
      },
    });
  };

  const processMessages = () => {
    const messages = document.querySelectorAll('.message');
    messages.forEach((el) => {
      const indexAttr = el.getAttribute('data-message-index');
      if (indexAttr === null) return;
      const index = parseInt(indexAttr, 10);
      if (!isNaN(index)) {
        injectButton(el as HTMLElement, index);
      }
    });
  };

  const unbinds: (() => void)[] = [];

  unbinds.push(
    events.on('chat:entered', () => {
      setTimeout(processMessages, 100);
    }),
  );

  unbinds.push(
    events.on('message:created', () => {
      setTimeout(processMessages, 100);
    }),
  );

  // Initial injection
  processMessages();

  return () => {
    unbinds.forEach((u) => u());
    document.querySelectorAll('.branch-button-wrapper').forEach((el) => el.remove());
  };
}
