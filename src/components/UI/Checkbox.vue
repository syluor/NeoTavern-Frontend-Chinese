<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { uuidv4 } from '../../utils/commons';

const props = defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const id = `checkbox-${uuidv4()}`;
const descriptionId = props.description ? `${id}-desc` : undefined;

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
}
</script>

<template>
  <div class="checkbox-container">
    <label class="checkbox-label" :class="{ disabled }" :for="id">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :aria-describedby="descriptionId"
        @change="onChange"
      />
      <span>{{ label }}</span>
    </label>
    <div v-if="description" :id="descriptionId" class="checkbox-description">
      {{ description }}
    </div>
  </div>
</template>
