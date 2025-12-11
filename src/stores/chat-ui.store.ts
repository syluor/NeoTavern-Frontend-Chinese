import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ChatMessageEditState {
  index: number;
  originalContent: string;
}

export const useChatUiStore = defineStore('chat-ui', () => {
  const isChatLoading = ref(false);
  const activeMessageEditState = ref<ChatMessageEditState | null>(null);
  const renderedMessagesCount = ref(100);

  function startEditing(index: number, content: string) {
    activeMessageEditState.value = {
      index,
      originalContent: content,
    };
  }

  function cancelEditing() {
    activeMessageEditState.value = null;
  }

  function resetRenderedMessagesCount(initialCount: number) {
    renderedMessagesCount.value = initialCount;
  }

  function loadMoreMessages(count: number) {
    renderedMessagesCount.value += count;
  }

  return {
    isChatLoading,
    activeMessageEditState,
    renderedMessagesCount,
    startEditing,
    cancelEditing,
    resetRenderedMessagesCount,
    loadMoreMessages,
  };
});
