<script setup lang="ts">
defineProps<{
  active?: boolean;
  selected?: boolean;
}>();
</script>

<template>
  <div class="list-item" :class="{ 'is-active': active, 'is-selected': selected }">
    <!-- Left: Avatar/Icon -->
    <div v-if="$slots.start" class="list-item-start">
      <slot name="start" />
    </div>

    <!-- Center: Text content -->
    <div class="list-item-content">
      <slot />
    </div>

    <!-- Right: Actions/Meta -->
    <div v-if="$slots.end" class="list-item-end">
      <slot name="end" />
    </div>
  </div>
</template>
