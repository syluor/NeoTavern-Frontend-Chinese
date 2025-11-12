import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Group } from '../types';

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Array<Group>>([]);
  const activeGroupId = ref<string | null>(null);
  const isGroupGenerating = ref<boolean>(false);

  return { groups, activeGroupId, isGroupGenerating };
});
