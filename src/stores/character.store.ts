import { defineStore } from 'pinia';
import { ref, computed, nextTick } from 'vue';
import { type Character } from '../types';
import {
  fetchAllCharacters,
  saveCharacter as apiSaveCharacter,
  importCharacter as apiImportCharacter,
  createCharacter as apiCreateCharacter,
  deleteCharacter as apiDeleteCharacter,
  updateCharacterImage as apiUpdateCharacterImage,
} from '../api/characters';
import DOMPurify from 'dompurify';
import { useCharacterTokens } from '../composables/useCharacterTokens';
import { DEFAULT_PRINT_TIMEOUT, DEFAULT_SAVE_EDIT_TIMEOUT } from '../constants';
import { useSettingsStore } from './settings.store';
import { onlyUnique } from '../utils/array';
import { debounce } from 'lodash-es';
import { eventEmitter } from '../utils/event-emitter';
import { getThumbnailUrl } from '../utils/image';
import { uuidv4 } from '../utils/common';
import { getCharacterDifferences, createCharacterFormData } from '../utils/character-manipulation';

const ANTI_TROLL_MAX_TAGS = 50;
const IMPORT_EXLCUDED_TAGS: string[] = [];

export const useCharacterStore = defineStore('character', () => {
  const settingsStore = useSettingsStore();

  const { tokenCounts, totalTokens, permanentTokens, calculateAllTokens } = useCharacterTokens();

  const characters = ref<Array<Character>>([]);
  const activeCharacterAvatars = ref<Set<string>>(new Set());
  const characterImageTimestamps = ref<Record<string, number>>({});

  const activeCharacters = computed<Character[]>(() => {
    return characters.value.filter((char) => activeCharacterAvatars.value.has(char.avatar));
  });

  const refreshCharactersDebounced = debounce(() => {
    refreshCharacters();
  }, DEFAULT_PRINT_TIMEOUT);

  async function refreshCharacters() {
    try {
      const newCharacters = await fetchAllCharacters();

      for (const char of newCharacters) {
        char.name = DOMPurify.sanitize(char.name);
        if (!char.chat) {
          char.chat = uuidv4();
        }
        char.chat = String(char.chat);
      }

      characters.value = newCharacters;

      const now = Date.now();
      for (const char of newCharacters) {
        if (!characterImageTimestamps.value[char.avatar]) {
          characterImageTimestamps.value[char.avatar] = now;
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Failed to fetch characters:', error);
      // Overflow warning handling should be done by the UI observing the error or a store state
      if (error.message === 'overflow') {
        throw new Error('overflow');
      }
    }
  }

  async function updateAndSaveCharacter(avatar: string, changes: Partial<Character>) {
    if (Object.keys(changes).length === 0) return;

    const dataToSave = { ...changes, avatar };
    await apiSaveCharacter(dataToSave);

    const index = characters.value.findIndex((c) => c.avatar === avatar);
    if (index !== -1) {
      const updatedCharacter = { ...characters.value[index], ...changes };
      updatedCharacter.name = DOMPurify.sanitize(updatedCharacter.name);
      characters.value[index] = updatedCharacter;

      await nextTick();
      await eventEmitter.emit('character:updated', updatedCharacter, changes);
    } else {
      console.warn(`Saved character with avatar ${avatar} not found in local list. Refreshing list.`);
      await refreshCharacters();
    }
  }

  async function renameCharacter(avatar: string, newName: string) {
    const character = characters.value.find((c) => c.avatar === avatar);
    if (!character) return;
    const changes = getCharacterDifferences(character, { ...character, name: newName });
    if (!changes) return;
    await updateAndSaveCharacter(avatar, changes);
  }

  async function saveCharacter(characterData: Character, originalCharacter?: Character) {
    if (!originalCharacter) return;

    const changes = getCharacterDifferences(originalCharacter, characterData);
    if (changes) {
      await updateAndSaveCharacter(originalCharacter.avatar, changes);
      if ('first_mes' in changes && changes.first_mes !== undefined) {
        await eventEmitter.emit('character:first-message-updated', originalCharacter.avatar, characterData);
      }
    }
  }

  const saveCharacterDebounced = debounce(saveCharacter, DEFAULT_SAVE_EDIT_TIMEOUT);

  async function importCharacter(file: File): Promise<string | undefined> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['json', 'png'].includes(ext)) {
      throw new Error(`unsupported_type:${ext}`);
    }

    try {
      const uuid = uuidv4();
      const newFileName = `${uuid}.${ext}`;
      const renamedFile = new File([file], newFileName, { type: file.type });

      const data = await apiImportCharacter(renamedFile);
      if (data.file_name) {
        const avatarFileName = `${data.file_name}.png`;

        await refreshCharacters();
        const importedChar = characters.value.find((c) => c.avatar === avatarFileName);
        if (importedChar) {
          await nextTick();
          await eventEmitter.emit('character:imported', importedChar);
        }

        return avatarFileName;
      }
    } catch (error) {
      console.error('Error importing character', error);
      throw error;
    }
  }

  /**
   * Imports tags for multiple characters based on settings.
   * Returns a map of Avatar -> ImportedTags[]
   */
  async function importTagsForCharacters(avatarFileNames: string[]): Promise<Record<string, string[]>> {
    const results: Record<string, string[]> = {};
    if (settingsStore.settings.character.tagImportSetting === 'none') {
      return results;
    }

    for (const avatar of avatarFileNames) {
      const character = characters.value.find((c) => c.avatar === avatar);
      if (character) {
        const imported = await handleTagImport(character);
        if (imported.length > 0) {
          results[avatar] = imported;
        }
      }
    }
    return results;
  }

  /**
   * Internal logic to import tags. Returns the list of tags that were added.
   */
  async function handleTagImport(character: Character): Promise<string[]> {
    const setting = settingsStore.settings.character.tagImportSetting;

    const alreadyAssignedTags = character.tags ?? [];
    const tagsFromCard = (character.tags ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => !IMPORT_EXLCUDED_TAGS.includes(t))
      .filter((t) => !alreadyAssignedTags.includes(t))
      .slice(0, ANTI_TROLL_MAX_TAGS);

    if (!tagsFromCard.length) return [];

    let tagsToImport: string[] = [];

    switch (setting) {
      case 'all':
        tagsToImport = tagsFromCard;
        break;
      case 'ask':
        // TODO: UI should handle 'ask'. For now, we return empty or implement a callback system.
        // Returning empty to avoid side effects in store.
        console.warn('Tag import "ask" setting not fully implemented in store refactor.');
        return [];
      case 'only_existing':
        // TODO: Requires global tag list.
        console.warn('Tag import "only_existing" setting not implemented.');
        return [];
      case 'none':
      default:
        return [];
    }

    if (tagsToImport.length > 0) {
      const newTags = [...alreadyAssignedTags, ...tagsToImport].filter(onlyUnique);
      const changes = getCharacterDifferences(character, { ...character, tags: newTags });
      if (!changes) return [];
      await updateAndSaveCharacter(character.avatar, changes);
      return tagsToImport;
    }

    return [];
  }

  async function createNewCharacter(character: Character, file?: File): Promise<string | undefined> {
    const uuid = uuidv4();
    const fileName = `${uuid}.png`;
    const fileToSend = file ? new File([file], fileName, { type: file.type }) : null;

    const formData = createCharacterFormData(character, fileToSend, uuid);

    const result = await apiCreateCharacter(formData);

    if (result && result.file_name) {
      await refreshCharacters();

      const newCharIndex = characters.value.findIndex((c) => c.avatar === result.file_name);
      if (newCharIndex !== -1) {
        const createdChar = characters.value[newCharIndex];
        await nextTick();
        await eventEmitter.emit('character:created', createdChar);
        return createdChar.avatar;
      }
    }
  }

  async function deleteCharacter(avatar: string, deleteChats: boolean) {
    await apiDeleteCharacter(avatar, deleteChats);
    await eventEmitter.emit('character:deleted', avatar);

    const index = characters.value.findIndex((c) => c.avatar === avatar);
    if (index !== -1) {
      characters.value.splice(index, 1);
    }
    delete characterImageTimestamps.value[avatar];
  }

  async function updateCharacterImage(avatar: string, imageFile: File) {
    await apiUpdateCharacterImage(avatar, imageFile);
    const character = characters.value.find((c) => c.avatar === avatar);
    if (character) {
      characterImageTimestamps.value[avatar] = Date.now();
    }
    await refreshCharacters();
  }

  async function duplicateCharacter(avatar: string) {
    const character = characters.value.find((c) => c.avatar === avatar);
    if (!character) return;

    const charCopy = { ...character, name: character.name };
    const uuid = uuidv4();
    charCopy.chat = uuid;
    delete charCopy.create_date;

    const url = getThumbnailUrl('avatar', avatar);
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], 'avatar.png', { type: blob.type });

    await createNewCharacter(charCopy, file);
  }

  function setActiveCharacterAvatars(avatars: string[]) {
    activeCharacterAvatars.value = new Set(avatars);
  }

  return {
    characters,
    activeCharacters,
    activeCharacterAvatars,
    characterImageTimestamps,
    refreshCharacters,
    refreshCharactersDebounced,
    saveCharacter,
    saveCharacterDebounced,
    tokenCounts,
    totalTokens,
    permanentTokens,
    calculateAllTokens,
    importCharacter,
    importTagsForCharacters,
    createNewCharacter,
    renameCharacter,
    deleteCharacter,
    updateCharacterImage,
    updateAndSaveCharacter,
    duplicateCharacter,
    setActiveCharacterAvatars,
  };
});
