<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChatStore } from '../../stores/chat.store';
import { useCharacterStore } from '../../stores/character.store';
import { usePopupStore } from '../../stores/popup.store';
import { POPUP_RESULT, POPUP_TYPE, type ChatInfo, type Character } from '../../types';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { humanizedDateTime } from '../../utils/date';
import * as api from '../../api/chat';
import { toast } from '../../composables/useToast';
import { GenerationMode, GroupGenerationHandlingMode, GroupReplyStrategy } from '../../constants';
import { getThumbnailUrl } from '../../utils/image';

const { t } = useStrictI18n();
const chatStore = useChatStore();
const characterStore = useCharacterStore();
const popupStore = usePopupStore();

const activeTab = ref<'chats' | 'members' | 'prompts'>('chats');
const selectedCharToAdd = ref('');

// --- Chat List Logic ---
const chats = computed<ChatInfo[]>(() => {
  if (!characterStore.activeCharacters) return [];
  const avatars = characterStore.activeCharacterAvatars;
  let allChats: ChatInfo[] = [];
  for (const avatar of avatars) {
    const chatsForAvatar = chatStore.chatsMetadataByCharacterAvatars[avatar];
    if (chatsForAvatar) {
      allChats.push(...chatsForAvatar);
    }
  }
  // Remove duplicates
  allChats = allChats.filter((chat, index, self) => index === self.findIndex((c) => c.file_id === chat.file_id));
  allChats.sort((a, b) => b.last_mes - a.last_mes);
  return allChats;
});

async function selectChat(chatFile: string) {
  await chatStore.setActiveChatFile(chatFile);
}

async function createNewChat(askConfirmation = true) {
  if (!characterStore.activeCharacters) return;
  const firstCharacter = characterStore.activeCharacters[0];
  let result: POPUP_RESULT = POPUP_RESULT.AFFIRMATIVE;
  let value = `${firstCharacter?.avatar} - ${humanizedDateTime()}`;
  if (askConfirmation) {
    ({ result, value } = await popupStore.show({
      title: t('chatManagement.newChat'),
      content: t('chatManagement.createPrompt'),
      type: POPUP_TYPE.INPUT,
      inputValue: value,
    }));
  }

  if (result === POPUP_RESULT.AFFIRMATIVE && value) {
    try {
      await chatStore.createNewChatForCharacter(firstCharacter.avatar, value.trim());
    } catch {
      toast.error(t('chatManagement.errors.create'));
    }
  }
}

async function renameChat(oldFile: string) {
  const { result, value: newName } = await popupStore.show({
    title: t('chatManagement.actions.rename'),
    content: t('chatManagement.renamePrompt'),
    type: POPUP_TYPE.INPUT,
    inputValue: oldFile,
  });

  if (result === POPUP_RESULT.AFFIRMATIVE && newName) {
    let newFileName = newName.trim();
    try {
      const info = chats.value.find((c) => c.file_id === oldFile);
      const isGroup = (info?.chat_metadata.members.length ?? 0) > 1;
      newFileName = (await api.renameChat(oldFile, newFileName, isGroup)).newFileName;
      if (chatStore.activeChatFile === oldFile) {
        chatStore.activeChatFile = newFileName;
      }
    } catch {
      toast.error(t('chatManagement.errors.rename'));
    }
  }
}

async function deleteChat(chatFile: string) {
  const { result } = await popupStore.show({
    title: t('chatManagement.deleteConfirmTitle'),
    content: t('chatManagement.deleteConfirmContent', { chatFile }),
    type: POPUP_TYPE.CONFIRM,
  });

  if (result === POPUP_RESULT.AFFIRMATIVE) {
    try {
      await api.deleteChat(chatFile);
      const index = chats.value.findIndex((chat) => chat.file_id === chatFile);
      const isActiveChat = chatStore.activeChatFile === chatFile;
      if (isActiveChat) {
        // Select another chat if available
        if (chats.value.length > 1) {
          const newIndex = index === 0 ? 1 : index - 1;
          const newChatFile = chats.value[newIndex].file_id;
          await selectChat(newChatFile);
        } else {
          await createNewChat(false);
        }
      }
      chatStore.chatInfos = chatStore.chatInfos.filter((chat) => chat.file_id !== chatFile);
    } catch {
      toast.error(t('chatManagement.errors.delete'));
    }
  }
}

// --- Group / Members Logic ---
const groupMembers = computed(() => {
  if (!chatStore.activeChat) return [];
  return chatStore.activeChat.metadata.members.map((avatar) => {
    return characterStore.characters.find((c) => c.avatar === avatar) || ({ name: avatar, avatar } as Character);
  });
});

const availableCharacters = computed(() => {
  if (!chatStore.activeChat) return [];
  const currentMembers = new Set(chatStore.activeChat.metadata.members);
  return characterStore.characters.filter((c) => !currentMembers.has(c.avatar));
});

const groupConfig = computed(() => chatStore.groupConfig);
const isGroup = computed(() => chatStore.isGroupChat);

function toggleMute(avatar: string) {
  chatStore.toggleMemberMute(avatar);
}

function forceTalk(avatar: string) {
  chatStore.generateResponse(GenerationMode.NEW, avatar);
}

function moveMember(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  chatStore.reorderMembers(index, newIndex);
}

function peekCharacter(avatar: string) {
  characterStore.selectCharacterByAvatar(avatar);
}

async function addMember() {
  if (selectedCharToAdd.value) {
    await chatStore.addMember(selectedCharToAdd.value);
    selectedCharToAdd.value = '';
  }
}

async function removeMember(avatar: string) {
  await chatStore.removeMember(avatar);
}
</script>

<template>
  <div class="popup-body chat-management">
    <div class="chat-management-header">
      <button class="menu-button" :class="{ active: activeTab === 'chats' }" @click="activeTab = 'chats'">
        {{ t('chatManagement.tabs.chats') }}
      </button>
      <button class="menu-button" :class="{ active: activeTab === 'members' }" @click="activeTab = 'members'">
        {{ t('chatManagement.tabs.group') }}
      </button>
      <button class="menu-button" :class="{ active: activeTab === 'prompts' }" @click="activeTab = 'prompts'">
        {{ t('chatManagement.tabs.prompts') }}
      </button>
    </div>

    <div class="chat-management-content">
      <!-- Tab: Chats -->
      <div v-show="activeTab === 'chats'">
        <div class="chat-management-actions">
          <button v-show="characterStore.activeCharacters.length > 0" class="menu-button" @click="createNewChat()">
            {{ t('chatManagement.newChat') }}
          </button>
        </div>
        <div class="chat-management-list">
          <table>
            <tbody>
              <tr v-for="file in chats" :key="file.file_id" class="chat-file-row" :data-file="file.file_id">
                <td class="chat-file-name">
                  <span v-show="chatStore.activeChatFile === file.file_id" class="active-indicator">
                    {{ t('chatManagement.active') }}
                  </span>
                  {{ file.file_id }}
                </td>
                <td class="chat-file-actions">
                  <button
                    class="menu-button"
                    :disabled="chatStore.activeChatFile === file.file_id"
                    :title="t('chatManagement.actions.select')"
                    @click="selectChat(file.file_id)"
                  >
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button
                    class="menu-button"
                    :title="t('chatManagement.actions.rename')"
                    @click="renameChat(file.file_id)"
                  >
                    <i class="fa-solid fa-pencil"></i>
                  </button>
                  <button
                    class="menu-button menu-button--danger"
                    :title="t('chatManagement.actions.delete')"
                    @click="deleteChat(file.file_id)"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Members / Group Config -->
      <div v-show="activeTab === 'members'">
        <!-- Add Member Control -->
        <div class="group-add-member">
          <select v-model="selectedCharToAdd" class="text-pole">
            <option value="" disabled>{{ t('group.selectToAdd') }}</option>
            <option v-for="char in availableCharacters" :key="char.avatar" :value="char.avatar">
              {{ char.name }}
            </option>
          </select>
          <button class="menu-button" :disabled="!selectedCharToAdd" @click="addMember">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <div class="group-members-list">
          <div
            v-for="(member, index) in groupMembers"
            :key="member.avatar"
            class="group-member-item"
            :class="{ muted: groupConfig?.members[member.avatar]?.muted }"
          >
            <img :src="getThumbnailUrl('avatar', member.avatar)" />
            <span class="group-member-name">{{ member.name }}</span>

            <div class="member-actions">
              <div
                v-if="isGroup"
                class="menu-button-icon fa-solid fa-address-card"
                :title="t('group.peek')"
                @click="peekCharacter(member.avatar)"
              ></div>
              <div
                v-if="isGroup"
                class="menu-button-icon fa-solid fa-comment-dots"
                :title="t('group.forceTalk')"
                @click="forceTalk(member.avatar)"
              ></div>
              <div
                v-if="isGroup"
                class="menu-button-icon fa-solid"
                :class="groupConfig?.members[member.avatar]?.muted ? 'fa-comment-slash' : 'fa-comment'"
                :title="t('group.mute')"
                @click="toggleMute(member.avatar)"
              ></div>
              <div
                class="menu-button-icon fa-solid fa-trash-can menu-button--danger"
                :title="t('common.remove')"
                @click="removeMember(member.avatar)"
              ></div>
              <div
                class="menu-button-icon fa-solid fa-arrow-up"
                v-if="index > 0"
                @click="moveMember(index, 'up')"
              ></div>
              <div
                class="menu-button-icon fa-solid fa-arrow-down"
                v-if="index < groupMembers.length - 1"
                @click="moveMember(index, 'down')"
              ></div>
            </div>
          </div>
        </div>

        <!-- Group Config: Only show if actual group -->
        <div v-if="isGroup && groupConfig" class="group-config-section">
          <hr />
          <label>
            {{ t('group.replyStrategy') }}
            <select v-model="groupConfig.config.replyStrategy" class="text-pole">
              <option :value="GroupReplyStrategy.MANUAL">{{ t('group.strategies.manual') }}</option>
              <option :value="GroupReplyStrategy.NATURAL_ORDER">{{ t('group.strategies.natural') }}</option>
              <option :value="GroupReplyStrategy.LIST_ORDER">{{ t('group.strategies.list') }}</option>
              <option :value="GroupReplyStrategy.POOLED_ORDER">{{ t('group.strategies.pooled') }}</option>
            </select>
          </label>

          <label>
            {{ t('group.handlingMode') }}
            <select v-model="groupConfig.config.handlingMode" class="text-pole">
              <option :value="GroupGenerationHandlingMode.SWAP">{{ t('group.modes.swap') }}</option>
              <option :value="GroupGenerationHandlingMode.JOIN_EXCLUDE_MUTED">
                {{ t('group.modes.joinExclude') }}
              </option>
              <option :value="GroupGenerationHandlingMode.JOIN_INCLUDE_MUTED">
                {{ t('group.modes.joinInclude') }}
              </option>
            </select>
          </label>

          <label class="checkbox-label">
            <input type="checkbox" v-model="groupConfig.config.allowSelfResponses" />
            {{ t('group.allowSelfResponses') }}
          </label>

          <label>
            {{ t('group.autoMode') }} ({{ t('common.seconds') }})
            <input type="number" v-model.number="groupConfig.config.autoMode" class="text-pole" min="0" />
            <small>{{ t('group.autoModeHint') }}</small>
          </label>
        </div>
      </div>

      <!-- Tab: Prompt Overrides -->
      <div v-show="activeTab === 'prompts'" style="padding: 5px">
        <div v-if="isGroup">
          <label>{{ t('group.scenarioOverride') }}</label>
          <textarea
            v-if="chatStore.activeChat?.metadata.promptOverrides"
            v-model="chatStore.activeChat.metadata.promptOverrides.scenario"
            class="text-pole"
            rows="6"
            :placeholder="t('group.scenarioOverridePlaceholder')"
          ></textarea>
          <!-- Initialize promptOverrides if missing, usually store handles structure but UI binding safe check needed -->
        </div>
        <div v-else>
          <p>{{ t('chatManagement.prompts.singleCharHint') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.group-add-member {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  select {
    flex-grow: 1;
  }
}
</style>
