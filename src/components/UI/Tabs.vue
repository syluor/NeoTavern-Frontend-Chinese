<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { label: string; value: string; icon?: string }[];
}>();

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="tabs">
    <button
      v-for="tab in options"
      :key="tab.value"
      class="tab-button"
      :class="{ active: modelValue === tab.value }"
      @click="emit('update:modelValue', tab.value)"
    >
      <i v-if="tab.icon" :class="['fa-solid', tab.icon]"></i>
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>
