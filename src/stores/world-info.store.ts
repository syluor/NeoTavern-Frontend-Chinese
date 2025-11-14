import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from './settings.store';
import {
  type WorldInfoBook,
  type WorldInfoSettings,
  WorldInfoInsertionStrategy,
  POPUP_TYPE,
  POPUP_RESULT,
} from '../types';
import * as api from '../api/world-info';
import { toast } from '../composables/useToast';
import { debounce } from '../utils/common';
import { defaultsDeep } from 'lodash-es';
import { usePopupStore } from './popup.store';
import { downloadFile } from '../utils/file';

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
  const popupStore = usePopupStore();

  const isPanelPinned = ref(false);
  const bookNames = ref<string[]>([]);
  const activeBookNames = ref<string[]>([]);
  const isSettingsExpanded = ref(false);

  const editingBookName = ref<string | null>(null);
  const editingBook = ref<WorldInfoBook | null>(null);

  const searchTerm = ref('');
  const sortOrder = ref('priority');

  const settings = computed({
    get: () => settingsStore.settings.world_info_settings,
    set: (value) => {
      settingsStore.setSetting('world_info_settings', { ...value });
    },
  });

  watch(
    () => settingsStore.settings.world_info_settings,
    (newSettings) => {
      if (newSettings) {
        const newValues = defaultsDeep({}, newSettings, defaultWorldInfoSettings);
        if (JSON.stringify(settings.value) !== JSON.stringify(newValues)) {
          settings.value = newValues;
        }
        activeBookNames.value = settings.value.world_info?.globalSelect ?? [];
      }
    },
    { deep: true, immediate: true },
  );

  watch(
    activeBookNames,
    (newActive) => {
      if (!settings.value.world_info) {
        settings.value.world_info = {};
      }
      settings.value.world_info.globalSelect = newActive;
    },
    { deep: true },
  );

  // TODO: We shouldn't call this for every WI action because `/settings/get` is expensive
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

  async function createNewBook() {
    const { result, value: newName } = await popupStore.show({
      title: 'New Lorebook',
      content: 'Enter the name for the new lorebook:',
      type: POPUP_TYPE.INPUT,
      inputValue: 'New Lorebook',
    });

    if (result === POPUP_RESULT.AFFIRMATIVE && newName) {
      const newBook: WorldInfoBook = { name: newName, entries: [] };
      try {
        await api.saveWorldInfoBook(newName, newBook);
        await initialize();
        await selectBookForEditing(newName);
        toast.success(`Created lorebook: ${newName}`);
      } catch (error) {
        toast.error(`Failed to create lorebook.`);
      }
    }
  }

  async function deleteEditingBook() {
    if (!editingBookName.value) return;
    const name = editingBookName.value;
    const { result } = await popupStore.show({
      title: 'Confirm Deletion',
      content: `Are you sure you want to delete the lorebook "<b>${name}</b>"?`,
      type: POPUP_TYPE.CONFIRM,
    });
    if (result === POPUP_RESULT.AFFIRMATIVE) {
      try {
        await api.deleteWorldInfoBook(name);
        await initialize();
        if (editingBookName.value === name) {
          selectBookForEditing(null);
        }
        toast.success(`Deleted lorebook: ${name}`);
      } catch (error) {
        toast.error('Failed to delete lorebook.');
      }
    }
  }

  async function renameEditingBook() {
    if (!editingBookName.value) return;
    const oldName = editingBookName.value;
    const { result, value: newName } = await popupStore.show({
      title: 'Rename Lorebook',
      content: 'Enter the new name:',
      type: POPUP_TYPE.INPUT,
      inputValue: oldName,
    });

    if (result === POPUP_RESULT.AFFIRMATIVE && newName && newName !== oldName) {
      try {
        await api.renameWorldInfoBook(oldName, newName); // This needs a backend endpoint
        await initialize();
        await selectBookForEditing(newName);
        toast.success(`Renamed to ${newName}`);
      } catch (error) {
        toast.error(`Failed to rename lorebook.`);
      }
    }
  }

  async function duplicateEditingBook() {
    // TODO
    toast.info('Duplicate feature not yet implemented.');
  }

  async function importBook(file: File) {
    try {
      const { name } = await api.importWorldInfoBook(file);
      await initialize();
      await selectBookForEditing(name);
      toast.success(`Imported lorebook: ${name}`);
    } catch (error) {
      toast.error('Failed to import lorebook.');
    }
  }

  async function exportEditingBook() {
    if (!editingBookName.value) return;
    try {
      const book = await api.exportWorldInfoBook(editingBookName.value);
      const content = JSON.stringify(book, null, 2);
      downloadFile(content, `${book.name}.json`, 'application/json');
    } catch (error) {
      toast.error('Failed to export lorebook.');
    }
  }

  const filteredEntries = computed(() => {
    if (!editingBook.value?.entries) return [];
    // TODO: Add filtering and sorting logic here
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
    createNewBook,
    deleteEditingBook,
    renameEditingBook,
    duplicateEditingBook,
    importBook,
    exportEditingBook,
  };
});
