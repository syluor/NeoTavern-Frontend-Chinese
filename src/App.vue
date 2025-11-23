<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ChatHeader from './components/Chat/ChatHeader.vue';
import ChatInterface from './components/Chat/ChatInterface.vue';
import ChatManagement from './components/Chat/ChatManagement.vue';
import RecentChats from './components/Chat/RecentChats.vue';
import AiConfigDrawer from './components/NavBar/AiConfigDrawer.vue';
import Navbar from './components/NavBar/NavBar.vue';
import Popup from './components/Popup/Popup.vue';
import Sidebar from './components/Shared/Sidebar.vue';
import ZoomedAvatar from './components/ZoomedAvatar.vue';
import { useStrictI18n } from './composables/useStrictI18n';
import { useBackgroundStore } from './stores/background.store';
import { usePopupStore } from './stores/popup.store';
import { useSettingsStore } from './stores/settings.store';
import { useUiStore } from './stores/ui.store';

const settingsStore = useSettingsStore();
const popupStore = usePopupStore();
const uiStore = useUiStore();
const backgroundStore = useBackgroundStore();
const { t } = useStrictI18n();

const backgroundStyle = computed(() => ({
  backgroundImage: backgroundStore.currentBackgroundUrl,
}));

const isFullScreen = computed(() => settingsStore.settings.account.chatFullScreen);

onMounted(() => {
  settingsStore.initializeSettings();

  // TODO: Add i18n
  uiStore.registerSidebar(
    'recent-chats',
    {
      component: RecentChats,
      title: 'Recent Chats',
      icon: 'fa-comments',
    },
    'left',
  );

  uiStore.registerSidebar(
    'ai-config',
    {
      component: AiConfigDrawer,
      title: 'AI Configuration',
      icon: 'fa-sliders',
    },
    'right',
  );

  uiStore.registerSidebar(
    'chat-management',
    {
      component: ChatManagement,
      title: t('chat.optionsMenu.manageChats'),
      icon: 'fa-address-book',
    },
    'right',
  );
});
</script>

<template>
  <div id="background" :style="backgroundStyle"></div>
  <Navbar />

  <Sidebar side="left" :is-open="uiStore.isLeftSidebarOpen" storage-key="leftSidebarWidth">
    <template v-for="[id, def] in uiStore.leftSidebarRegistry" :key="id">
      <div v-show="uiStore.leftSidebarView === id" style="height: 100%">
        <component :is="def.component" v-bind="def.componentProps" />
      </div>
    </template>
  </Sidebar>

  <!-- Main Layout -->
  <main
    id="main-content"
    :class="{
      'full-screen': isFullScreen,
      'left-open': uiStore.isLeftSidebarOpen,
      'right-open': uiStore.isRightSidebarOpen,
    }"
  >
    <ChatHeader />
    <div class="content-wrapper">
      <ChatInterface />
    </div>
    <template v-for="avatar in uiStore.zoomedAvatars" :key="avatar.id">
      <ZoomedAvatar :avatar="avatar" />
    </template>
  </main>

  <Sidebar side="right" :is-open="uiStore.isRightSidebarOpen" storage-key="rightSidebarWidth">
    <template v-for="[id, def] in uiStore.rightSidebarRegistry" :key="id">
      <div v-show="uiStore.rightSidebarView === id" style="height: 100%">
        <component :is="def.component" v-bind="def.componentProps" />
      </div>
    </template>
  </Sidebar>

  <template v-for="popup in popupStore.popups" :key="popup.id">
    <Popup
      v-bind="popup"
      @submit="(payload: any) => popupStore.confirm(popup.id, payload)"
      @close="popupStore.cancel(popup.id)"
    />
  </template>
</template>

<style lang="scss" scoped>
.content-wrapper {
  height: calc(100% - var(--header-height));
  position: relative;
}
</style>
