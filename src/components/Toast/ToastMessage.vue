<script setup lang="ts">
import type { PropType } from 'vue';
import { onMounted, ref } from 'vue';
// eslint-disable-next-line vue/no-dupe-keys
import { toast, type Toast } from '../../composables/useToast';

const props = defineProps({
  toast: {
    type: Object as PropType<Toast>,
    required: true,
  },
});

const isVisible = ref(false);

onMounted(() => {
  // Animate in
  requestAnimationFrame(() => {
    isVisible.value = true;
  });

  // Set timeout to auto-remove
  if (props.toast.timeout && props.toast.timeout > 0) {
    setTimeout(() => {
      hide();
    }, props.toast.timeout);
  }
});

function hide() {
  isVisible.value = false;
  const transitionDuration = 250;
  setTimeout(() => {
    toast.remove(props.toast.id);
  }, transitionDuration + 10); // Add a small buffer
}
</script>

<template>
  <div class="toast" :class="[`toast-${props.toast.type}`, { show: isVisible }]">
    <button v-if="!props.toast.timeout" type="button" class="toast-close-button" @click="hide">&times;</button>
    <div v-if="props.toast.title" class="toast-title">{{ props.toast.title }}</div>
    <div class="toast-message">{{ props.toast.message }}</div>
  </div>
</template>
