<script setup lang="ts">
import { ref } from 'vue';
import { useResizable } from '../../composables/useResizable';
import type { Settings } from '@/types';

const props = defineProps<{
  side: 'left' | 'right';
  isOpen: boolean;
  storageKey?: keyof Settings['account'];
}>();

const sidebarRef = ref<HTMLElement | null>(null);
const resizerRef = ref<HTMLElement | null>(null);

const cssVariable = props.side === 'left' ? '--sidebar-left-width' : '--sidebar-right-width';

useResizable(sidebarRef, resizerRef, {
  storageKey: props.storageKey,
  initialWidth: 350,
  minWidth: 200,
  side: props.side,
  cssVariable,
});
</script>

<template>
  <aside
    :id="`app-sidebar-${side}`"
    ref="sidebarRef"
    class="app-sidebar"
    :class="[`app-sidebar--${side}`, { 'is-open': isOpen }]"
  >
    <div ref="resizerRef" class="app-sidebar-resizer"></div>

    <div class="app-sidebar-content">
      <slot></slot>
    </div>
  </aside>
</template>
