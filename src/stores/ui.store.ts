import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MenuType, ZoomedAvatar } from '../types';

export const useUiStore = defineStore('ui', () => {
  const isChatSaving = ref<boolean>(false);
  const isDeleteMode = ref<boolean>(false);
  const isSendPress = ref<boolean>(false);
  const selectedButton = ref<MenuType | null>(null);
  const menuType = ref<MenuType | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cropData = ref<any>(null); // TODO: Proper type
  const activePlayerName = ref<string | null>(null);
  const activePlayerAvatar = ref<string | null>(null);
  const zoomedAvatars = ref<ZoomedAvatar[]>([]);

  function toggleZoomedAvatar(avatarData: Omit<ZoomedAvatar, 'id'>) {
    const id = avatarData.charName; // Use charName as ID to toggle

    const existingIndex = zoomedAvatars.value.findIndex((avatar) => avatar.id === id);

    if (existingIndex > -1) {
      // It exists, so remove it
      zoomedAvatars.value.splice(existingIndex, 1);
    } else {
      zoomedAvatars.value.push({ ...avatarData, id });
    }
  }

  function removeZoomedAvatar(id: string) {
    const index = zoomedAvatars.value.findIndex((avatar) => avatar.id === id);
    if (index > -1) {
      zoomedAvatars.value.splice(index, 1);
    }
  }

  return {
    isChatSaving,
    isDeleteMode,
    isSendPress,
    selectedButton,
    menuType,
    cropData,
    activePlayerName,
    activePlayerAvatar,
    zoomedAvatars,
    toggleZoomedAvatar,
    removeZoomedAvatar,
  };
});
