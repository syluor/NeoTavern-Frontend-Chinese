<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { uuidv4 } from '../../utils/commons';

defineProps<{
  modelValue: boolean;
  disabled?: boolean;
  title?: string;
  label?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const id = `toggle-${uuidv4()}`;
</script>

<template>
  <label
    class="toggle-label"
    :class="{ disabled }"
    :title="title"
    :for="id"
    @keydown.enter.prevent="emit('update:modelValue', !modelValue)"
    @keydown.space.prevent="emit('update:modelValue', !modelValue)"
  >
    <span class="toggle-switch">
      <input
        :id="id"
        type="checkbox"
        role="switch"
        :aria-checked="modelValue"
        :aria-label="label || title"
        :checked="modelValue"
        :disabled="disabled"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span class="slider" aria-hidden="true"></span>
    </span>
    <span v-if="label" class="sr-only">{{ label }}</span>
  </label>
</template>

<style scoped>
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
