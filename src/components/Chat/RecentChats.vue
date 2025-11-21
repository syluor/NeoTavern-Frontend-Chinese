<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useChatStore } from '../../stores/chat.store';
import { useSettingsStore } from '../../stores/settings.store';
import { usePopupStore } from '../../stores/popup.store';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { formatTimeStamp } from '../../utils/date';
import { getThumbnailUrl } from '../../utils/image';
import { POPUP_TYPE, POPUP_RESULT, type ChatInfo } from '../../types';
import { listRecentChats, deleteChat } from '../../api/chat';
import { toast } from '../../composables/useToast';
import Pagination from '../Common/Pagination.vue';

const { t } = useStrictI18n();
const chatStore = useChatStore();
const settingsStore = useSettingsStore();
const popupStore = usePopupStore();

// Persistence for page size
const STORAGE_KEY = 'recent_chats_page_size';
const savedSize = settingsStore.getAccountItem(STORAGE_KEY);

const currentPage = ref(1);
const itemsPerPage = ref(savedSize ? parseInt(savedSize, 10) : 10);

// Selection Mode
const isSelectionMode = ref(false);
const selectedChats = ref<Set<string>>(new Set());

watch(itemsPerPage, (newVal) => {
  settingsStore.setAccountItem(STORAGE_KEY, newVal.toString());
  currentPage.value = 1;
});

const recentChats = computed(() => chatStore.recentChats);

const paginatedRecentChats = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return recentChats.value.slice(start, end);
});

// Reset to page 1 if the list is refreshed or emptied
watch(
  () => recentChats.value.length,
  () => {
    if ((currentPage.value - 1) * itemsPerPage.value >= recentChats.value.length) {
      currentPage.value = Math.max(1, Math.ceil(recentChats.value.length / itemsPerPage.value));
    }
  },
);

function getChatAvatar(chat: ChatInfo) {
  const members = chat.chat_metadata.members || [];
  if (members.length === 0) return null;
  if (members.length === 1) return getThumbnailUrl('avatar', members[0]);
  return members.slice(0, 4).map((m) => getThumbnailUrl('avatar', m));
}

function isGroup(chat: ChatInfo) {
  return (chat.chat_metadata.members?.length ?? 0) > 1;
}

async function onItemClick(chat: ChatInfo) {
  if (isSelectionMode.value) {
    toggleSelection(chat.file_id);
  } else {
    await chatStore.setActiveChatFile(chat.file_id);
  }
}

function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value;
  selectedChats.value.clear();
}

function toggleSelection(fileId: string) {
  if (selectedChats.value.has(fileId)) {
    selectedChats.value.delete(fileId);
  } else {
    selectedChats.value.add(fileId);
  }
}

function selectAllVisible() {
  const allSelected = paginatedRecentChats.value.every((c) => selectedChats.value.has(c.file_id));
  if (allSelected) {
    // Deselect visible
    paginatedRecentChats.value.forEach((c) => selectedChats.value.delete(c.file_id));
  } else {
    // Select visible
    paginatedRecentChats.value.forEach((c) => selectedChats.value.add(c.file_id));
  }
}

async function deleteSelected() {
  if (selectedChats.value.size === 0) return;

  const count = selectedChats.value.size;
  const { result } = await popupStore.show({
    title: t('chatManagement.deleteConfirmTitle'),
    content: t('chatManagement.deleteSelectedConfirmContent', { count }),
    type: POPUP_TYPE.CONFIRM,
    okButton: 'common.delete',
  });

  if (result === POPUP_RESULT.AFFIRMATIVE) {
    try {
      const idsToDelete = Array.from(selectedChats.value);
      for (const id of idsToDelete) {
        await deleteChat(id);
      }
      // Update store
      chatStore.recentChats = chatStore.recentChats.filter((c) => !selectedChats.value.has(c.file_id));
      // If active chat was deleted, clear it
      if (chatStore.activeChatFile && selectedChats.value.has(chatStore.activeChatFile)) {
        chatStore.activeChatFile = null;
        await chatStore.clearChat(false);
      }
      selectedChats.value.clear();
      isSelectionMode.value = false;
      toast.success(t('chatManagement.deleteSuccess', { count }));
    } catch (error) {
      console.error(error);
      toast.error(t('chatManagement.errors.delete'));
    }
  }
}

async function refresh() {
  try {
    chatStore.recentChats = await listRecentChats();
  } catch (err) {
    console.error(err);
    toast.error(t('chat.loadError'));
  }
}

onMounted(() => {
  if (chatStore.recentChats.length === 0) {
    refresh();
  }
});
</script>

<template>
  <div class="recent-chats">
    <div class="recent-chats-header">
      <h3>{{ t('navbar.recentChats') }}</h3>
      <div class="recent-chats-actions">
        <button
          class="menu-button-icon fa-solid"
          :class="isSelectionMode ? 'fa-xmark' : 'fa-check-to-slot'"
          :title="isSelectionMode ? t('common.cancel') : t('common.select')"
          @click="toggleSelectionMode"
        ></button>
        <button
          class="menu-button-icon fa-solid fa-rotate-right"
          :title="t('common.refresh')"
          @click="refresh"
        ></button>
      </div>
    </div>

    <div v-if="isSelectionMode" class="recent-chats-selection-bar">
      <div class="selection-info">{{ selectedChats.size }} {{ t('common.selected') }}</div>
      <div class="selection-actions">
        <button class="menu-button small" @click="selectAllVisible">
          {{ t('common.selectAll') }}
        </button>
        <button
          class="menu-button menu-button--danger small"
          :disabled="selectedChats.size === 0"
          @click="deleteSelected"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>

    <div class="recent-chats-content">
      <div
        v-for="chat in paginatedRecentChats"
        :key="chat.file_id"
        class="recent-chat-item"
        :class="{
          active: chatStore.activeChatFile === chat.file_id,
          selected: selectedChats.has(chat.file_id),
          'selection-mode': isSelectionMode,
        }"
        @click="onItemClick(chat)"
      >
        <div class="recent-chat-item-avatar">
          <template v-if="isGroup(chat)">
            <div class="group-avatar-grid">
              <img
                v-for="(avatar, index) in (getChatAvatar(chat) as string[]) || []"
                :key="index"
                :src="avatar"
                onerror="this.src='img/ai4.png'"
              />
            </div>
          </template>
          <template v-else>
            <img :src="getChatAvatar(chat) as string" onerror="this.src='img/ai4.png'" />
          </template>

          <div v-if="isSelectionMode" class="selection-checkbox">
            <i v-if="selectedChats.has(chat.file_id)" class="fa-solid fa-check"></i>
          </div>
        </div>

        <div class="recent-chat-item-details">
          <div class="recent-chat-item-name" :title="chat.file_name">
            {{ chat.file_name.replace('.jsonl', '') }}
          </div>
          <div class="recent-chat-item-preview">
            {{ chat.mes || t('chat.emptyLog') }}
          </div>
          <div class="recent-chat-item-meta">
            <span>{{ formatTimeStamp(chat.last_mes) }}</span>
            <span>{{ chat.chat_items }} {{ t('common.messages').toLowerCase() }}</span>
          </div>
        </div>
      </div>

      <div v-if="recentChats.length === 0" class="recent-chats-empty">
        <i class="fa-solid fa-comments"></i>
        <p>{{ t('chatManagement.noRecentChats') }}</p>
      </div>
    </div>

    <div class="recent-chats-pagination">
      <Pagination
        v-if="recentChats.length > 0"
        v-model:current-page="currentPage"
        v-model:items-per-page="itemsPerPage"
        :total-items="recentChats.length"
        :items-per-page-options="[10, 20, 50]"
      />
    </div>
  </div>
</template>
