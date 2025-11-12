import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ChatMessage } from '../types';
import { usePromptStore } from './prompt.store';
import { useCharacterStore } from './character.store';
import { fetchChat } from '../api/chat';
import { humanizedDateTime } from '../utils/date';
import { uuidv4 } from '../utils/common';

export const useChatStore = defineStore('chat', () => {
  const chat = ref<Array<ChatMessage>>([]);
  const chatMetadata = ref<Record<string, any>>({});
  const chatCreateDate = ref<string | null>(null);
  const activeMessageEditIndex = ref<number | null>(null);
  const chatSaveTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
  const saveMetadataTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

  function getCurrentChatId() {
    // TODO: Integrate group store later
    const characterStore = useCharacterStore();
    return characterStore.activeCharacter?.chat;
  }

  async function clearChat() {
    if (chatSaveTimeout.value) clearTimeout(chatSaveTimeout.value);
    if (saveMetadataTimeout.value) clearTimeout(saveMetadataTimeout.value);

    chat.value = [];
    chatMetadata.value = {};
    chatCreateDate.value = null;
    activeMessageEditIndex.value = null;
    chatSaveTimeout.value = null;
    saveMetadataTimeout.value = null;

    const promptStore = usePromptStore();
    promptStore.extensionPrompts = {};
    await promptStore.saveItemizedPrompts(getCurrentChatId());
    promptStore.itemizedPrompts = [];
  }

  async function refreshChat() {
    const characterStore = useCharacterStore();
    const activeCharacter = characterStore.activeCharacter;

    if (!activeCharacter) {
      console.error('refreshChat called with no active character');
      return;
    }

    // TODO: unshallow character logic if needed

    try {
      const response = await fetchChat(activeCharacter, chatMetadata.value);

      if (response.length > 0) {
        // Assuming the first element contains metadata
        const metadataItem = response.shift();
        chatCreateDate.value = metadataItem?.create_date ?? null;
        chatMetadata.value = metadataItem?.chat_metadata ?? {};
        chat.value = response;
      } else {
        chatCreateDate.value = humanizedDateTime();
        chatMetadata.value = {};
        chat.value = [];
      }

      if (!chatMetadata.value['integrity']) {
        chatMetadata.value['integrity'] = uuidv4();
      }

      // TODO: getChatResult logic, which adds first message etc.

      const promptStore = usePromptStore();
      await promptStore.loadItemizedPrompts(getCurrentChatId());
    } catch (error) {
      console.error('Failed to refresh chat:', error);
    }
  }

  return {
    chat,
    chatMetadata,
    chatCreateDate,
    activeMessageEditIndex,
    chatSaveTimeout,
    saveMetadataTimeout,
    clearChat,
    refreshChat,
  };
});
