<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { usePersonaStore } from '../../stores/persona.store';
import { useSettingsStore } from '../../stores/settings.store';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { getThumbnailUrl } from '../../utils/image';
import Pagination from '../Common/Pagination.vue';
import { usePopupStore } from '../../stores/popup.store';
import { POPUP_RESULT, POPUP_TYPE, type Character } from '../../types';
import { Button, IconButton, Select, Checkbox, Textarea } from '../UI';
import Search from '../UI/Search.vue';
import ListItem from '../UI/ListItem.vue';
import FileInput from '../UI/FileInput.vue';
import FormItem from '../UI/FormItem.vue';
import { useChatStore } from '../../stores/chat.store';
import { useCharacterStore } from '../../stores/character.store';
import { storeToRefs } from 'pinia';

const { t } = useStrictI18n();
const personaStore = usePersonaStore();
const settingsStore = useSettingsStore();
const popupStore = usePopupStore();
const chatStore = useChatStore();
const characterStore = useCharacterStore();

const { activeChat } = storeToRefs(chatStore);
const { activeCharacters } = storeToRefs(characterStore);

const searchTerm = ref('');
const sortOrder = ref('asc');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isGridView = ref(false);

const sortOptions = [
  { label: 'A-Z', value: 'asc' },
  { label: 'Z-A', value: 'desc' },
];

const filteredPersonas = computed(() => {
  let personas = [...personaStore.personas];
  if (searchTerm.value) {
    const lowerSearch = searchTerm.value.toLowerCase();
    personas = personas.filter(
      (p) => p.name.toLowerCase().includes(lowerSearch) || p.description.toLowerCase().includes(lowerSearch),
    );
  }
  personas.sort((a, b) => {
    if (sortOrder.value === 'asc') return a.name.localeCompare(b.name);
    return b.name.localeCompare(a.name);
  });
  return personas;
});

const paginatedPersonas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPersonas.value.slice(start, end);
});

const connectedCharacters = computed(() => {
  if (!personaStore.activePersona?.connections) return [];
  return personaStore.activePersona.connections
    .map((conn) => characterStore.characters.find((c) => c.avatar === conn.id))
    .filter(Boolean) as Character[];
});

const isChatLocked = computed(() => {
  if (!activeChat.value || !personaStore.activePersonaId) return false;
  return activeChat.value.metadata.active_persona === personaStore.activePersonaId;
});

const isCharacterLocked = computed(() => {
  if (activeCharacters.value.length !== 1 || !personaStore.activePersonaId) return false;
  return personaStore.isLinkedToCharacter(personaStore.activePersonaId, activeCharacters.value[0].avatar);
});

const isDefaultPersona = computed(() => {
  if (!personaStore.activePersonaId) return false;
  return personaStore.isDefault(personaStore.activePersonaId);
});

function handleFileImport(files: File[]) {
  console.log('Restore from backup clicked', files);
}

async function handleDelete() {
  if (personaStore.activePersonaId) {
    const { result } = await popupStore.show({
      title: t('personaManagement.delete.confirmTitle'),
      content: t('personaManagement.delete.confirmMessage', { name: personaStore.activePersona?.name ?? '' }),
      type: POPUP_TYPE.CONFIRM,
    });
    if (result === POPUP_RESULT.AFFIRMATIVE) {
      personaStore.deletePersona(personaStore.activePersonaId);
    }
  }
}

async function handleAvatarChange(files: File[]) {
  if (files[0]) {
    await personaStore.uploadPersonaAvatar(personaStore.activePersonaId, files[0]);
  }
}

function toggleDefault() {
  if (personaStore.activePersonaId) {
    personaStore.toggleDefault(personaStore.activePersonaId);
  }
}

function toggleCharacterLock() {
  if (activeCharacters.value.length === 1 && personaStore.activePersonaId) {
    personaStore.toggleCharacterConnection(personaStore.activePersonaId, activeCharacters.value[0].avatar);
  }
}

function toggleChatLock() {
  if (activeChat.value && personaStore.activePersonaId) {
    chatStore.toggleChatPersona(personaStore.activePersonaId);
  }
}

function removeConnection(charAvatar: string) {
  if (personaStore.activePersonaId) {
    personaStore.toggleCharacterConnection(personaStore.activePersonaId, charAvatar);
  }
}

onMounted(() => {
  if (personaStore.personas.length === 0) {
    personaStore.initialize();
  }
});
</script>

<template>
  <div class="persona-drawer">
    <div class="persona-drawer-header">
      <h3>
        <span>{{ t('personaManagement.title') }}</span>
        <a href="https://docs.sillytavern.app/usage/core-concepts/personas/" target="_blank">
          <span class="fa-solid fa-circle-question note-link-span"></span>
        </a>
      </h3>
      <div class="persona-drawer-header-actions">
        <Button icon="fa-ranking-star">{{ t('personaManagement.usageStats') }}</Button>
        <Button icon="fa-file-export">{{ t('personaManagement.backup') }}</Button>
        <FileInput
          accept=".json"
          icon="fa-file-import"
          type="button"
          :label="t('personaManagement.restore')"
          @change="handleFileImport"
        />
      </div>
    </div>
    <div class="persona-drawer-content">
      <!-- Left Column -->
      <div class="persona-drawer-column--left">
        <div class="persona-drawer-list-controls">
          <Search v-model="searchTerm" :placeholder="t('common.search')">
            <template #actions>
              <Button icon="fa-person-circle-question" @click="personaStore.createPersona">
                {{ t('personaManagement.create') }}
              </Button>
              <Select v-model="sortOrder" :options="sortOptions" />
              <IconButton icon="fa-table-cells-large" @click="isGridView = !isGridView" />
            </template>
          </Search>
        </div>
        <Pagination
          v-if="filteredPersonas.length > 0"
          v-model:current-page="currentPage"
          v-model:items-per-page="itemsPerPage"
          :total-items="filteredPersonas.length"
          :items-per-page-options="[5, 10, 25, 50, 100]"
        />
        <div class="persona-list" :class="{ 'grid-view': isGridView }">
          <div v-for="persona in paginatedPersonas" :key="`${persona.avatarId}-${personaStore.lastAvatarUpdate}`">
            <ListItem
              :active="persona.avatarId === personaStore.activePersonaId"
              @click="personaStore.setActivePersona(persona.avatarId)"
            >
              <template #start>
                <img
                  :src="getThumbnailUrl('persona', persona.avatarId)"
                  alt="Persona Avatar"
                  class="persona-item-avatar"
                />
              </template>
              <template #default>
                <div class="font-bold persona-name-row">
                  <span class="persona-name">{{ persona.name }}</span>
                  <i
                    v-if="personaStore.isDefault(persona.avatarId)"
                    class="fa-solid fa-star default-icon"
                    :title="t('personaManagement.default.tooltip')"
                  ></i>
                </div>
                <div class="persona-desc">
                  {{ persona.description || t('personaManagement.noDescription') }}
                </div>
              </template>
            </ListItem>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="persona-drawer-column--right">
        <div v-show="personaStore.activePersona" class="persona-editor">
          <h4 class="standoutHeader">{{ t('personaManagement.currentPersona') }}</h4>
          <div class="persona-editor-controls">
            <h5 class="persona-editor-name">{{ personaStore.activePersona?.name ?? '' }}</h5>
            <div class="buttons_block">
              <IconButton
                icon="fa-pencil"
                :title="t('personaManagement.actions.rename')"
                @click="personaStore.updateActivePersonaName"
              />
              <IconButton icon="fa-sync" :title="t('personaManagement.actions.syncName')" />
              <IconButton icon="fa-globe" :title="t('personaManagement.actions.lore')" />

              <FileInput
                accept="image/*"
                icon="fa-image"
                :label="t('personaManagement.actions.changeImage')"
                @change="handleAvatarChange"
              />

              <IconButton icon="fa-clone" :title="t('personaManagement.actions.duplicate')" />
              <IconButton
                variant="danger"
                icon="fa-skull"
                :title="t('personaManagement.actions.delete')"
                @click="handleDelete"
              />
            </div>
          </div>

          <FormItem :label="t('personaManagement.description.label')">
            <Textarea
              :model-value="personaStore.activePersona?.description ?? ''"
              :rows="6"
              :placeholder="t('personaManagement.description.placeholder')"
              @update:model-value="personaStore.updateActivePersonaField('description', $event)"
            />
          </FormItem>
          <!-- TODO: Add token counter -->

          <h4 class="standoutHeader">{{ t('personaManagement.connections.title') }}</h4>
          <div class="persona-editor-connections">
            <Button icon="fa-star" :active="isDefaultPersona" @click="toggleDefault">
              {{ t('personaManagement.connections.default') }}
            </Button>
            <Button
              icon="fa-user-lock"
              :active="isCharacterLocked"
              :disabled="activeCharacters.length !== 1"
              @click="toggleCharacterLock"
            >
              {{ t('personaManagement.connections.character') }}
            </Button>
            <Button icon="fa-lock" :active="isChatLocked" :disabled="!activeChat" @click="toggleChatLock">
              {{ t('personaManagement.connections.chat') }}
            </Button>
          </div>

          <div v-if="connectedCharacters.length > 0" class="connected-characters-list">
            <h5>{{ t('personaManagement.connections.linkedCharacters') }}</h5>
            <div class="chips-container">
              <div v-for="char in connectedCharacters" :key="char.avatar" class="character-chip">
                <img :src="getThumbnailUrl('avatar', char.avatar)" class="chip-avatar" />
                <span class="chip-name">{{ char?.name ?? '' }}</span>
                <i class="fa-solid fa-xmark chip-remove" @click="removeConnection(char.avatar)"></i>
              </div>
            </div>
          </div>

          <h4 class="standoutHeader">{{ t('personaManagement.globalSettings.title') }}</h4>
          <div class="persona-editor-global-settings">
            <Checkbox
              v-model="settingsStore.settings.persona.showNotifications"
              :label="t('personaManagement.globalSettings.showNotifications')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-bold {
  font-weight: bold;
}

.persona-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.persona-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.default-icon {
  color: var(--color-golden);
  font-size: 0.9em;
}

.persona-desc {
  font-size: 0.9em;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connected-characters-list {
  margin-top: 10px;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.character-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--black-30a);
  border: 1px solid var(--theme-border-color);
  border-radius: 15px;
  padding: 2px 8px 2px 2px;
  font-size: 0.9em;
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.chip-remove {
  cursor: pointer;
  opacity: 0.6;
  margin-left: 2px;
}

.chip-remove:hover {
  opacity: 1;
  color: var(--color-warning);
}
</style>
