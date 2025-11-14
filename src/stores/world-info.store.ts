import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from './settings.store';
import { type WorldInfoBook, type WorldInfoSettings, WorldInfoInsertionStrategy } from '../types';
import * as api from '../api/world-info';
import { toast } from '../composables/useToast';
import { debounce } from '../utils/common';
import { defaultsDeep } from 'lodash-es';

export const defaultWorldInfoSettings: WorldInfoSettings = {
  world_info: {},
  world_info_depth: 2,
  world_info_min_activations: 0,
  world_info_min_activations_depth_max: 0,
  world_info_budget: 25,
  world_info_include_names: true,
  world_info_recursive: false,
  world_info_overflow_alert: false,
  world_info_case_sensitive: false,
  world_info_match_whole_words: false,
  world_info_character_strategy: WorldInfoInsertionStrategy.CHARACTER_FIRST,
  world_info_budget_cap: 0,
  world_info_use_group_scoring: false,
  world_info_max_recursion_steps: 0,
};

export const useWorldInfoStore = defineStore('world-info', () => {
  const settingsStore = useSettingsStore();

  const isPanelPinned = ref(false);
  const bookNames = ref<string[]>([]);
  const activeBookNames = ref<string[]>([]); // Globally active books
  const isSettingsExpanded = ref(false);

  const editingBookName = ref<string | null>(null);
  const editingBook = ref<WorldInfoBook | null>(null);

  const searchTerm = ref('');
  const sortOrder = ref('priority');

  const settings = computed({
    get: () => settingsStore.settings.world_info_settings,
    set: (value) => {
      // Create a new object to ensure reactivity
      settingsStore.setSetting('world_info_settings', { ...value });
    },
  });

  // Sync settings with the main settings store
  watch(
    () => settingsStore.settings.world_info_settings,
    (newSettings) => {
      if (newSettings) {
        // Use a temporary variable to avoid triggering the setter's watcher
        const newValues = defaultsDeep({}, newSettings, defaultWorldInfoSettings);
        if (JSON.stringify(settings.value) !== JSON.stringify(newValues)) {
          settings.value = newValues;
        }
        activeBookNames.value = settings.value.world_info?.globalSelect ?? [];
      }
    },
    { deep: true, immediate: true },
  );

  // When active books change, update the settings store
  watch(
    activeBookNames,
    (newActive) => {
      if (!settings.value.world_info) {
        settings.value.world_info = {};
      }
      settings.value.world_info.globalSelect = newActive;
      // The settings store watcher will handle debounced saving.
    },
    { deep: true },
  );

  async function initialize() {
    try {
      bookNames.value = await api.fetchAllWorldInfoNames();
    } catch (error) {
      console.error('Failed to load world info list:', error);
      toast.error('Could not load lorebooks.');
    }
  }

  async function selectBookForEditing(name: string | null) {
    if (!name) {
      editingBookName.value = null;
      editingBook.value = null;
      return;
    }
    try {
      editingBook.value = await api.fetchWorldInfoBook(name);
      editingBookName.value = name;
    } catch (error) {
      console.error(`Failed to load book ${name} for editing:`, error);
      toast.error(`Could not load lorebook: ${name}`);
      editingBookName.value = null;
      editingBook.value = null;
    }
  }

  // TODO: Add other actions: create, import, export, rename, delete, etc.
  const saveEditingBookDebounced = debounce(async () => {
    if (editingBook.value) {
      try {
        await api.saveWorldInfoBook(editingBook.value.name, editingBook.value);
        toast.success(`Saved lorebook: ${editingBook.value.name}`);
      } catch (error) {
        console.error('Failed to save lorebook:', error);
        toast.error('Failed to save lorebook.');
      }
    }
  }, 1000);

  // TODO: Implement pagination and filtering for entries
  const filteredEntries = computed(() => {
    if (!editingBook.value?.entries) return [];
    // Add filtering and sorting logic here later
    return editingBook.value.entries;
  });

  return {
    isPanelPinned,
    settings,
    isSettingsExpanded,
    bookNames,
    activeBookNames,
    editingBookName,
    editingBook,
    searchTerm,
    sortOrder,
    initialize,
    selectBookForEditing,
    saveEditingBookDebounced,
    filteredEntries,
  };
});
