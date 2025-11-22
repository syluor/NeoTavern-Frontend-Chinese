<script setup lang="ts">
import { ref, watch } from 'vue';
import { slideTransitionHooks } from '../../utils/dom';

interface Props {
  title: string;
  /**
   * Controlled state. Use v-model:is-open="var" in parent.
   */
  isOpen?: boolean;
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: undefined,
  subtitle: '',
});

const emit = defineEmits(['update:isOpen']);

// Internal state.
// If controlled (isOpen defined), sync with it.
const internalIsOpen = ref(props.isOpen);

const { beforeEnter, enter, afterEnter, beforeLeave, leave, afterLeave } = slideTransitionHooks;

// Watch for external updates (Controlled Mode)
watch(
  () => props.isOpen,
  (val) => {
    if (val !== undefined) {
      internalIsOpen.value = val;
    }
  },
);

function toggle() {
  const newValue = !internalIsOpen.value;
  internalIsOpen.value = newValue;
  emit('update:isOpen', newValue);
}
</script>

<template>
  <div class="inline-drawer">
    <div class="inline-drawer-header" @click="toggle">
      <div class="inline-drawer-title">
        {{ title }}
        <small v-if="subtitle" class="subtitle">{{ subtitle }}</small>
      </div>

      <!-- Header Actions Slot (e.g. buttons) -->
      <div v-if="$slots.actions" class="header-actions" @click.stop>
        <slot name="actions" />
      </div>

      <i class="fa-solid fa-circle-chevron-down inline-drawer-icon" :class="{ 'is-open': internalIsOpen }"></i>
    </div>

    <Transition
      name="slide-js"
      @before-enter="beforeEnter"
      @enter="enter"
      @after-enter="afterEnter"
      @before-leave="beforeLeave"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div v-show="internalIsOpen" class="drawer-wrapper">
        <div class="inline-drawer-content">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>
