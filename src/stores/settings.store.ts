import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SendOnEnterOptions, DEFAULT_SAVE_EDIT_TIMEOUT } from '../constants';
import { isMobile } from '../utils/browser';
import { debounce } from '../utils/common';
import {
  type Settings,
  type LegacySettings,
  type SettingDefinition,
  type SettingsPath,
  type AccountStorageKey,
} from '../types';
import { fetchUserSettings, saveUserSettings as apiSaveUserSettings } from '../api/settings';
import { settingsDefinition } from '../settings-definition';
import { toast } from '../composables/useToast';
import { set, get, defaultsDeep } from 'lodash-es';
import { useUiStore } from './ui.store';
import type { ValueForPath } from '../types/utils';
import { defaultWorldInfoSettings } from './world-info.store';

// --- Create type aliases for convenience ---
type SettingsValue<P extends SettingsPath> = ValueForPath<Settings, P>;
// -----------------------------------------

function createDefaultSettings(): Settings {
  const defaultSettings: Record<string, any> = {};
  for (const def of settingsDefinition) {
    // This now correctly sets nested properties based on the new structure
    set(defaultSettings, def.id, def.defaultValue);
  }

  // Manually set complex default objects that aren't in settingsDefinition
  defaultSettings.api = {
    main: 'openai',
    oai: {}, // This will be populated by the api.store's defaults
  };
  defaultSettings.worldInfo = defaultWorldInfoSettings;
  defaultSettings.account = {};
  defaultSettings.persona = {
    showNotifications: true,
    allowMultiConnections: false,
    autoLock: false,
    personas: {},
    defaultPersona: null,
    personaDescriptions: {},
  };

  return defaultSettings as Settings;
}

function migrateLegacyToExperimental(legacy: LegacySettings): Settings {
  const p = legacy.power_user || ({} as LegacySettings['power_user']);
  const migrated: Settings = {
    ui: {
      background: {
        ...(legacy.background || {}),
      },
      panels: {
        movingUI: p.movingUI,
      },
      avatars: {
        zoomedMagnification: p.zoomed_avatar_magnification,
        neverResize: p.never_resize_avatars,
      },
    },
    chat: {
      sendOnEnter: p.send_on_enter,
      autoFixMarkdown: p.auto_fix_generated_markdown,
      confirmMessageDelete: p.confirm_message_delete,
    },
    character: {
      spoilerFreeMode: p.spoiler_free_mode,
      worldImportDialog: p.world_import_dialog,
      tagImportSetting: p.tag_import_setting,
    },
    persona: {
      showNotifications: p.persona_show_notifications,
      allowMultiConnections: p.persona_allow_multi_connections,
      autoLock: p.persona_auto_lock,
      personas: p.personas,
      defaultPersona: p.default_persona,
      personaDescriptions: p.persona_descriptions,
    },
    api: {
      main: legacy.main_api || 'openai',
      oai: legacy.oai_settings,
    },
    worldInfo: legacy.world_info_settings,
    account: legacy.account_storage,
  };
  return migrated;
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(createDefaultSettings());
  const settingsInitializing = ref(true);
  const definitions = ref<SettingDefinition[]>(settingsDefinition);
  // Keep a copy of the full legacy settings to preserve unsused fields on save
  const fullLegacySettings = ref<LegacySettings | null>(null);

  const shouldSendOnEnter = computed(() => {
    switch (settings.value.chat.sendOnEnter) {
      case SendOnEnterOptions.DISABLED:
        return false;
      case SendOnEnterOptions.AUTO:
        return !isMobile();
      case SendOnEnterOptions.ENABLED:
        return true;
      default:
        return false;
    }
  });

  function getSetting<P extends SettingsPath>(id: P): SettingsValue<P> {
    const definition = definitions.value.find((def) => def.id === id);
    return get(settings.value, id, definition?.defaultValue) as SettingsValue<P>;
  }

  function setSetting<P extends SettingsPath>(id: P, value: SettingsValue<P>) {
    set(settings.value, id, value);
    saveSettingsDebounced();
  }

  // Provides a way to modify legacy settings that haven't been migrated yet (e.g., complex persona objects)
  function setLegacySetting(path: string, value: any) {
    if (fullLegacySettings.value) {
      set(fullLegacySettings.value, path, value);
      saveSettingsDebounced();
    }
  }

  function getAccountItem(key: AccountStorageKey): string | null {
    return settings.value.account?.[key] ?? null;
  }

  function setAccountItem(key: AccountStorageKey, value: string) {
    if (!settings.value.account) {
      settings.value.account = {};
    }
    settings.value.account[key] = value;
    saveSettingsDebounced();
  }

  async function initializeSettings() {
    if (!settingsInitializing.value) return;

    try {
      const legacySettings = (await fetchUserSettings()) as LegacySettings;
      fullLegacySettings.value = legacySettings;

      const defaultSettings = createDefaultSettings();
      let experimentalSettings: Settings;

      if (legacySettings.v2Experimental) {
        // If new structure exists, use it but merge with defaults to add any newly defined settings.
        experimentalSettings = defaultsDeep({}, legacySettings.v2Experimental, defaultSettings);
      } else {
        // If not, migrate from legacy structure.
        experimentalSettings = migrateLegacyToExperimental(legacySettings);
        // Then merge with defaults.
        experimentalSettings = defaultsDeep(experimentalSettings, defaultSettings);
      }

      settings.value = experimentalSettings;

      const uiStore = useUiStore();
      uiStore.activePlayerName = legacySettings.username || null;
      uiStore.activePlayerAvatar = legacySettings.user_avatar || null;
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      toast.error('Could not load user settings. Using defaults.');
      // The store already has defaults, so we can just continue safely.
    } finally {
      Promise.resolve().then(() => {
        settingsInitializing.value = false;
      });
    }
  }

  const saveSettingsDebounced = debounce(async () => {
    if (settingsInitializing.value || !fullLegacySettings.value) return;

    const settingsToSave: LegacySettings = { ...fullLegacySettings.value };
    settingsToSave.v2Experimental = settings.value;

    await apiSaveUserSettings(settingsToSave);
  }, DEFAULT_SAVE_EDIT_TIMEOUT);

  return {
    settings,
    definitions,
    shouldSendOnEnter,
    saveSettingsDebounced,
    initializeSettings,
    settingsInitializing,
    getSetting,
    setSetting,
    setLegacySetting,
    getAccountItem,
    setAccountItem,
  };
});
