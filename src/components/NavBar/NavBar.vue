<script setup lang="ts">
import { computed } from 'vue';
import { useUiStore } from '../../stores/ui.store';
import type { NavBarItemDefinition } from '../../types';
import { Button } from '../UI';

const uiStore = useUiStore();
const navItems = computed(() => Array.from(uiStore.navBarRegistry));

const mainNavItems = computed(() => navItems.value.filter(([, item]) => !!item.layoutComponent));
const floatingNavItems = computed(() =>
  navItems.value.filter(([, item]) => !!item.targetSidebarId && !item.layoutComponent),
);
const drawerNavItems = computed(() =>
  navItems.value.filter(([, item]) => !item.layoutComponent && !item.targetSidebarId),
);

const isActive = (id: string, item: NavBarItemDefinition) => {
  if (item.targetSidebarId) {
    return uiStore.isLeftSidebarOpen && uiStore.leftSidebarView === item.targetSidebarId;
  }

  if (!item.layoutComponent) {
    return uiStore.activeDrawer === id;
  }

  if (uiStore.activeMainLayout === id) {
    if (uiStore.isLeftSidebarOpen && item.defaultSidebarId) {
      return uiStore.leftSidebarView === item.defaultSidebarId;
    }
    return true;
  }

  return false;
};
</script>

<template>
  <div>
    <div id="nav-bar" class="nav-bar">
      <div class="nav-bar-nav">
        <!-- Main Sections (Top) -->
        <div class="nav-bar-section nav-bar-section--main">
          <div v-for="[id, item] in mainNavItems" :key="id" class="nav-item">
            <Button
              variant="ghost"
              :icon="item.icon"
              :active="isActive(id, item)"
              :title="item.title"
              @click="uiStore.activateNavBarItem(id)"
            />
          </div>
        </div>

        <!-- Floating/Sidebar Toggles (Middle) -->
        <div v-if="floatingNavItems.length" class="nav-bar-section nav-bar-section--floating">
          <div v-for="[id, item] in floatingNavItems" :key="id" class="nav-item">
            <Button
              variant="ghost"
              :icon="item.icon"
              :active="isActive(id, item)"
              :title="item.title"
              @click="uiStore.activateNavBarItem(id)"
            />
          </div>
        </div>

        <!-- Drawers (Bottom) -->
        <div v-if="drawerNavItems.length" class="nav-bar-section nav-bar-section--drawer">
          <div v-for="[id, item] in drawerNavItems" :key="id" class="nav-item">
            <Button
              variant="ghost"
              :icon="item.icon"
              :active="isActive(id, item)"
              :title="item.title"
              @click="uiStore.activateNavBarItem(id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer Content Areas -->
    <template v-for="[id, item] in drawerNavItems" :key="id">
      <div
        v-show="item.component"
        class="nav-item-content"
        :class="{
          active: uiStore.activeDrawer === id,
          wide: item.layout === 'wide',
        }"
      >
        <component :is="item.component" />
      </div>
    </template>
  </div>
</template>
