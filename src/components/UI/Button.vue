<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';

interface Props {
  variant?: 'default' | 'danger' | 'confirm' | 'ghost';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  disabled: false,
  loading: false,
  title: undefined,
  icon: undefined,
  active: false,
});

const emit = defineEmits(['click']);

const classes = computed(() => {
  return {
    'menu-button': true,
    'menu-button--danger': props.variant === 'danger',
    'menu-button--confirm': props.variant === 'confirm',
    'menu-button--ghost': props.variant === 'ghost',
    disabled: props.disabled || props.loading,
    active: props.active,
  };
});

function onClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<template>
  <button :class="classes" :disabled="disabled || loading" :title="title" @click="onClick">
    <Icon v-if="loading" icon="fa-spinner" spin />
    <Icon v-else-if="icon" :icon="icon" />
    <span v-if="$slots.default" :class="{ 'ml-2': icon || loading }">
      <slot />
    </span>
  </button>
</template>
