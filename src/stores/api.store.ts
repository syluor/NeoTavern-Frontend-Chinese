import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import type { OaiPrompt, OaiPromptOrderConfig, OaiSettings } from '../types';
import { chat_completion_sources } from '../types';
import { fetchChatCompletionStatus } from '../api/connection';
import { toast } from '../composables/useToast';
import { useSettingsStore } from './settings.store';
import { defaultsDeep, isEqual } from 'lodash-es';
import i18n from '../i18n';

export const useApiStore = defineStore('api', () => {
  const settingsStore = useSettingsStore();

  const mainApi = ref('openai');
  const oaiSettings = ref<Partial<OaiSettings>>({});
  const onlineStatus = ref('Not connected...');
  const isConnecting = ref(false);
  const modelList = ref<any[]>([]);

  const defaultOaiSettings: Partial<OaiSettings> = {
    chat_completion_source: chat_completion_sources.OPENAI,
    openai_model: 'gpt-4o',
    claude_model: 'claude-sonnet-4-5',
    openrouter_model: 'OR_Website',
    temp_openai: 1.0,
    freq_pen_openai: 0,
    pres_pen_openai: 0,
    top_p_openai: 1,
    top_k_openai: 0,
    openai_max_context: 16384,
    openai_max_tokens: 500,
    stream_openai: true,
    prompts: [
      {
        name: 'Main Prompt',
        system_prompt: true,
        role: 'system',
        content: "Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}.",
        identifier: 'main',
      },
      { name: 'Post-History Instructions', system_prompt: true, role: 'system', content: '', identifier: 'jailbreak' },
      { identifier: 'chatHistory', name: 'Chat History', system_prompt: true, marker: true },
      { identifier: 'charDescription', name: 'Char Description', system_prompt: true, marker: true },
      { identifier: 'charPersonality', name: 'Char Personality', system_prompt: true, marker: true },
      { identifier: 'scenario', name: 'Scenario', system_prompt: true, marker: true },
      { identifier: 'dialogueExamples', name: 'Chat Examples', system_prompt: true, marker: true },
    ] as OaiPrompt[],
    prompt_order: [
      {
        character_id: 100000,
        order: [
          { identifier: 'main', enabled: true },
          { identifier: 'charDescription', enabled: true },
          { identifier: 'charPersonality', enabled: true },
          { identifier: 'scenario', enabled: true },
          { identifier: 'dialogueExamples', enabled: true },
          { identifier: 'chatHistory', enabled: true },
          { identifier: 'jailbreak', enabled: true },
        ],
      },
    ] as OaiPromptOrderConfig[],
  };

  const activeModel = computed(() => {
    switch (oaiSettings.value.chat_completion_source) {
      case chat_completion_sources.OPENAI:
        return oaiSettings.value.openai_model;
      case chat_completion_sources.CLAUDE:
        return oaiSettings.value.claude_model;
      case chat_completion_sources.OPENROUTER:
        return oaiSettings.value.openrouter_model;
      default:
        return oaiSettings.value.openai_model;
    }
  });

  // @ts-ignore
  const groupedOpenRouterModels: Record<string, any[]> | null = computed(() => {
    if (
      oaiSettings.value.chat_completion_source !== chat_completion_sources.OPENROUTER ||
      modelList.value.length === 0
    ) {
      return null;
    }
    // TODO: implement sorting from settings
    const sortedList = [...modelList.value].sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

    // Group by vendor
    const vendors = sortedList.reduce(
      (acc, model) => {
        const vendor = model.id.split('/')[0];
        if (!acc[vendor]) {
          acc[vendor] = [];
        }
        acc[vendor].push(model);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return vendors;
  });

  // When settings are loaded or changed from the backend, update our local API state.
  watch(
    () => settingsStore.settings,
    (newSettings) => {
      if (newSettings) {
        mainApi.value = newSettings.main_api || 'openai';
        oaiSettings.value = defaultsDeep({}, newSettings.oai_settings, defaultOaiSettings);
      } else {
        oaiSettings.value = { ...defaultOaiSettings };
      }
    },
    { deep: true, immediate: true },
  );

  // When the user changes API settings in the UI, save them back to the settings store.
  watch(mainApi, (newValue) => {
    if (settingsStore.settingsInitializing) return;
    if (newValue !== settingsStore.settings?.main_api) {
      settingsStore.setSetting('main_api', newValue);
    }
  });

  watch(
    oaiSettings,
    (newSettings) => {
      if (settingsStore.settingsInitializing) return;
      if (!isEqual(newSettings, settingsStore.settings?.oai_settings)) {
        settingsStore.setSetting('oai_settings', newSettings);
      }
    },
    { deep: true },
  );

  // When the main API or source changes, try to reconnect
  watch(
    () => [mainApi.value, oaiSettings.value.chat_completion_source],
    () => {
      // Avoid connecting if settings are not initialized yet
      if (settingsStore.powerUser.send_on_enter === undefined) return;
      connect();
    },
  );

  async function connect() {
    if (isConnecting.value) return;

    modelList.value = [];

    if (mainApi.value !== 'openai') {
      onlineStatus.value = `${i18n.global.t('api.status.notConnected')} ${i18n.global.t('api.status.notImplemented')}`;
      return;
    }

    isConnecting.value = true;
    onlineStatus.value = i18n.global.t('api.status.connecting');

    try {
      // TODO: Implement secret management. For now, we pass the key directly.
      // TODO: Implement reverse proxy confirmation popup.
      const response = await fetchChatCompletionStatus(oaiSettings.value);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && Array.isArray(response.data)) {
        modelList.value = response.data;

        // Check if current model selection is still valid
        const source = oaiSettings.value.chat_completion_source;
        const availableModels = modelList.value.map((m) => m.id);

        if (source === chat_completion_sources.OPENAI) {
          if (!availableModels.includes(oaiSettings.value.openai_model ?? '')) {
            oaiSettings.value.openai_model = availableModels.length > 0 ? availableModels[0] : 'gpt-4o';
          }
        } else if (source === chat_completion_sources.OPENROUTER) {
          if (
            oaiSettings.value.openrouter_model !== 'OR_Website' &&
            !availableModels.includes(oaiSettings.value.openrouter_model ?? '')
          ) {
            oaiSettings.value.openrouter_model = availableModels.length > 0 ? availableModels[0] : 'OR_Website';
          }
        }
      }

      onlineStatus.value = response.bypass ? i18n.global.t('api.status.bypassed') : i18n.global.t('api.status.valid');
      toast.success(i18n.global.t('api.connectSuccess'));
    } catch (error: any) {
      onlineStatus.value = i18n.global.t('api.status.noConnection');
      toast.error(error.message || i18n.global.t('api.connectFailed'));
      console.error(error);
    } finally {
      isConnecting.value = false;
    }
  }

  return { mainApi, oaiSettings, onlineStatus, isConnecting, connect, activeModel, modelList, groupedOpenRouterModels };
});
