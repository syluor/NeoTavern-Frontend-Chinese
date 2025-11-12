import { defineStore } from 'pinia';
import { ref } from 'vue';
import localforage from 'localforage';
import type { ExtensionPrompt } from '../types';

const promptStorage = localforage.createInstance({ name: 'SillyTavern_Prompts' });

export const usePromptStore = defineStore('prompt', () => {
  const extensionPrompts = ref<Record<string, ExtensionPrompt>>({});
  const itemizedPrompts = ref<Array<any>>([]);

  async function saveItemizedPrompts(chatId?: string) {
    try {
      if (!chatId) {
        return;
      }
      // localforage can store arrays directly
      await promptStorage.setItem(chatId, itemizedPrompts.value);
    } catch {
      console.log('Error saving itemized prompts for chat', chatId);
    }
  }

  async function loadItemizedPrompts(chatId?: string) {
    try {
      if (!chatId) {
        itemizedPrompts.value = [];
        return;
      }
      const prompts = (await promptStorage.getItem(chatId)) as any[] | null;
      itemizedPrompts.value = prompts ?? [];
    } catch {
      console.log('Error loading itemized prompts for chat', chatId);
      itemizedPrompts.value = [];
    }
  }

  return { extensionPrompts, itemizedPrompts, saveItemizedPrompts, loadItemizedPrompts };
});
