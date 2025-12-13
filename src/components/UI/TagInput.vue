<script setup lang="ts">
import { ref } from 'vue';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { uuidv4 } from '../../utils/commons';
import Button from './Button.vue';

interface Props {
  modelValue: string[];
  placeholder?: string;
  label?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const inputValue = ref('');
const inputId = `tag-input-${uuidv4()}`;
const listId = `tag-list-${uuidv4()}`;
const descId = `tag-desc-${uuidv4()}`;

const { t } = useStrictI18n();

function addTag() {
  const val = inputValue.value.trim();
  if (!val) return;

  // Split by comma if user pasted text
  const newTags = val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Deduplicate against existing
  const distinct = newTags.filter((t) => !props.modelValue.includes(t));

  if (distinct.length > 0) {
    emit('update:modelValue', [...props.modelValue, ...distinct]);
  }
  inputValue.value = '';
}

function removeTag(index: number) {
  const newTags = [...props.modelValue];
  newTags.splice(index, 1);
  emit('update:modelValue', newTags);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addTag();
  } else if (e.key === 'Backspace' && inputValue.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1);
  }
}
</script>

<template>
  <div class="tag-input-container">
    <label v-if="label" :for="inputId" class="tag-input-label sr-only">{{ label }}</label>

    <span :id="descId" class="sr-only">{{ t('a11y.tagInput.description') }}</span>

    <div class="tag-input-controls">
      <input
        :id="inputId"
        ref="inputRef"
        v-model="inputValue"
        class="text-pole"
        :placeholder="placeholder"
        :aria-describedby="descId"
        :aria-controls="listId"
        @keydown="handleKeydown"
        @blur="addTag"
      />
      <Button
        icon="fa-plus"
        :title="t('a11y.tagInput.addTag')"
        :aria-label="t('a11y.tagInput.addTag')"
        @click="addTag"
      />
    </div>

    <div :id="listId" class="tags-list" role="list" :aria-label="t('a11y.tagInput.tagsList')">
      <span v-for="(tag, idx) in modelValue" :key="idx" class="tag" role="listitem">
        {{ tag }}
        <button
          class="tag-close-btn"
          :aria-label="t('a11y.tagInput.removeTag', { tag })"
          @click="removeTag(idx)"
          @keydown.enter.prevent="removeTag(idx)"
          @keydown.space.prevent="removeTag(idx)"
        >
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tag-close-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 4px;
  margin-left: 4px;
  opacity: 0.7;
  font-size: 0.9em;

  &:hover,
  &:focus {
    opacity: 1;
    color: var(--color-accent-red);
  }

  &:focus {
    outline: 1px dotted currentColor;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
