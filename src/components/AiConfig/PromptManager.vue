<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSettingsStore } from '../../stores/settings.store';
import { useStrictI18n } from '../../composables/useStrictI18n';
import type { Prompt } from '../../types/settings';
import { cloneDeep } from 'lodash-es';
import { toast } from '../../composables/useToast';
import type { MessageRole } from '@/types';
import { Button, Input, Select, Textarea, FormItem } from '../UI';
import { EmptyState, DraggableList } from '../Common';

const settingsStore = useSettingsStore();
const { t } = useStrictI18n();

// Local state for editing
const editingIdentifier = ref<string | null>(null);

// Interface for the UI list
interface DisplayPrompt extends Prompt {
  enabled: boolean;
}

const displayPrompts = computed<DisplayPrompt[]>(() => {
  const definitions = settingsStore.settings.api.samplers.prompts || [];
  const orderConfig = settingsStore.settings.api.samplers.prompt_order?.order || [];

  const defMap = new Map(definitions.map((p) => [p.identifier, p]));

  const result: DisplayPrompt[] = [];
  const processedIds = new Set<string>();

  for (const item of orderConfig) {
    const def = defMap.get(item.identifier);
    if (def) {
      result.push({ ...def, enabled: item.enabled });
      processedIds.add(item.identifier);
    }
  }

  for (const def of definitions) {
    if (!processedIds.has(def.identifier)) {
      result.push({ ...def, enabled: true });
    }
  }

  return result;
});

const roleOptions = [
  { label: 'System', value: 'system' },
  { label: 'User', value: 'user' },
  { label: 'Assistant', value: 'assistant' },
];

function saveChanges(newDisplayList: DisplayPrompt[]) {
  const newDefinitions: Prompt[] = newDisplayList.map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { enabled, ...rest } = p;
    return rest;
  });

  const newOrder = newDisplayList.map((p) => ({
    identifier: p.identifier,
    enabled: p.enabled,
  }));

  settingsStore.settings.api.samplers.prompts = newDefinitions;
  settingsStore.settings.api.samplers.prompt_order = { order: newOrder };
}

function createNewPrompt() {
  const id = `custom-${Date.now()}`;
  const newPrompt: DisplayPrompt = {
    name: 'New Prompt',
    identifier: id,
    system_prompt: true,
    content: '',
    role: 'system',
    enabled: true,
  };

  const newList = [...displayPrompts.value, newPrompt];
  saveChanges(newList);
  editingIdentifier.value = id;
}

function deletePrompt(identifier: string) {
  const p = displayPrompts.value.find((x) => x.identifier === identifier);
  if (!p) return;

  if (p.marker) {
    toast.error(t('aiConfig.promptManager.cannotDeleteMarker'));
    return;
  }

  const newList = displayPrompts.value.filter((x) => x.identifier !== identifier);
  saveChanges(newList);

  if (editingIdentifier.value === identifier) {
    editingIdentifier.value = null;
  }
}

function toggleEdit(identifier: string) {
  if (editingIdentifier.value === identifier) {
    editingIdentifier.value = null;
  } else {
    editingIdentifier.value = identifier;
  }
}

function toggleEnabled(index: number) {
  const newList = cloneDeep(displayPrompts.value);
  newList[index].enabled = !newList[index].enabled;
  saveChanges(newList);
}

function updatePromptField(index: number, field: keyof Prompt, value: string | number | MessageRole) {
  const newList = cloneDeep(displayPrompts.value);
  // @ts-expect-error Dynamic assignment
  newList[index][field] = value;
  saveChanges(newList);
}

function getBadgeClass(role?: string) {
  switch (role) {
    case 'system':
      return 'prompt-item-badge--system';
    case 'user':
      return 'prompt-item-badge--user';
    case 'assistant':
      return 'prompt-item-badge--assistant';
    default:
      return '';
  }
}
</script>

<template>
  <div class="prompt-manager">
    <div class="prompt-manager-header">
      <Button icon="fa-plus" @click="createNewPrompt">
        {{ t('aiConfig.promptManager.newPrompt') }}
      </Button>
    </div>

    <div class="prompt-manager-list-container">
      <DraggableList
        :items="displayPrompts"
        item-key="identifier"
        handle-class="prompt-item-drag-handle"
        class="prompt-manager-list"
        @update:items="saveChanges"
      >
        <template #default="{ item: prompt, index }">
          <div
            class="prompt-item"
            :class="{
              disabled: !prompt.enabled,
              'is-editing': editingIdentifier === prompt.identifier,
            }"
            :data-identifier="prompt.identifier"
          >
            <!-- Header Row -->
            <div class="prompt-item-header">
              <div class="prompt-item-actions">
                <div
                  class="menu-button fa-solid fa-grip-lines prompt-item-drag-handle"
                  :title="t('common.dragToReorder')"
                ></div>
              </div>

              <div class="prompt-item-info" @click="toggleEdit(prompt.identifier)">
                <span class="prompt-item-name">{{ prompt.name }}</span>
                <div class="prompt-item-badges">
                  <span v-if="prompt.marker" class="prompt-item-badge prompt-item-badge--marker">Marker</span>
                  <span v-else class="prompt-item-badge" :class="getBadgeClass(prompt.role)">{{ prompt.role }}</span>
                </div>
              </div>

              <div class="prompt-item-actions">
                <Button
                  :icon="prompt.enabled ? 'fa-toggle-on' : 'fa-toggle-off'"
                  variant="ghost"
                  :title="t('common.toggle')"
                  @click.stop="toggleEnabled(index)"
                />

                <Button
                  icon="fa-trash"
                  variant="danger"
                  :disabled="!!prompt.marker"
                  @click.stop="deletePrompt(prompt.identifier)"
                />
              </div>
            </div>

            <!-- Editor Row (Expandable) -->
            <div v-show="editingIdentifier === prompt.identifier" class="prompt-item-editor">
              <FormItem :label="t('common.name')">
                <Input :model-value="prompt.name" @update:model-value="(v) => updatePromptField(index, 'name', v)" />
              </FormItem>

              <template v-if="!prompt.marker">
                <FormItem :label="t('aiConfig.promptManager.role')">
                  <Select
                    :model-value="prompt.role || 'system'"
                    :options="roleOptions"
                    @update:model-value="(v) => updatePromptField(index, 'role', v as MessageRole)"
                  />
                </FormItem>

                <FormItem :label="t('aiConfig.promptManager.content')">
                  <Textarea
                    :model-value="prompt.content || ''"
                    :rows="5"
                    @update:model-value="(v) => updatePromptField(index, 'content', v)"
                  />
                </FormItem>
              </template>
              <div v-else class="prompt-empty-state" style="padding: 5px; font-size: 0.9em">
                {{ t('aiConfig.promptManager.markerHint') }}
              </div>
            </div>
          </div>
        </template>
      </DraggableList>

      <EmptyState
        v-if="displayPrompts.length === 0"
        icon="fa-layer-group"
        :description="t('aiConfig.promptManager.noPrompts')"
      />
    </div>
  </div>
</template>
