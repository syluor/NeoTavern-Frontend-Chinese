<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { useStrictI18n } from '../../composables/useStrictI18n';
import { uuidv4 } from '../../utils/commons';

const { t } = useStrictI18n();

defineProps<{
  modelValue: string;
  options: { label: string; value: string; icon?: string }[];
}>();

const emit = defineEmits(['update:modelValue']);

const tabsId = `tabs-${uuidv4()}`;
</script>

<template>
  <div class="tabs" role="tablist" :aria-label="t('a11y.tabs.list')">
    <button
      v-for="tab in options"
      :id="`${tabsId}-tab-${tab.value}`"
      :key="tab.value"
      class="tab-button"
      :class="{ active: modelValue === tab.value }"
      role="tab"
      :aria-selected="modelValue === tab.value"
      :aria-controls="`${tabsId}-panel-${tab.value}`"
      :tabindex="modelValue === tab.value ? 0 : -1"
      @click="emit('update:modelValue', tab.value)"
      @keydown.space.prevent="emit('update:modelValue', tab.value)"
      @keydown.enter.prevent="emit('update:modelValue', tab.value)"
    >
      <i v-if="tab.icon" :class="['fa-solid', tab.icon]" aria-hidden="true"></i>
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>
