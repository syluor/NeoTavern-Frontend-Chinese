<script setup lang="ts">
import CharacterPanel from '../CharacterPanel/CharacterPanel.vue';
import ExtensionsDrawer from './ExtensionsDrawer.vue';
import UserSettingsDrawer from './UserSettingsDrawer.vue';
import ApiConnectionsDrawer from './ApiConnectionsDrawer.vue';
import AiConfigDrawer from './AiConfigDrawer.vue';
import BackgroundsDrawer from './BackgroundsDrawer.vue';
import WorldInfoDrawer from './WorldInfoDrawer.vue';
import PersonaManagementDrawer from './PersonaManagementDrawer.vue';
import FormattingDrawer from './FormattingDrawer.vue';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { useUiStore } from '../../stores/ui.store';
import type { DrawerType } from '../../types';
import { Button } from '../UI';

const { t } = useStrictI18n();

const uiStore = useUiStore();

function toggleDrawer(drawerName: DrawerType) {
  if (uiStore.activeDrawer === drawerName) {
    uiStore.activeDrawer = null; // Close if already open
  } else {
    uiStore.activeDrawer = drawerName; // Open the new one
  }
}
</script>

<template>
  <div>
    <div id="nav-bar" class="nav-bar">
      <div class="nav-bar-nav">
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-sliders"
            :active="uiStore.activeDrawer === 'ai-config'"
            :title="t('navbar.aiConfig')"
            @click="toggleDrawer('ai-config')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-plug"
            :active="uiStore.activeDrawer === 'api-status'"
            :title="t('navbar.apiConnections')"
            @click="toggleDrawer('api-status')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-font"
            :active="uiStore.activeDrawer === 'formatting'"
            :title="t('navbar.formatting')"
            @click="toggleDrawer('formatting')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-book-atlas"
            :active="uiStore.activeDrawer === 'world-info'"
            :title="t('navbar.worldInfo')"
            @click="toggleDrawer('world-info')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-user-cog"
            :active="uiStore.activeDrawer === 'user-settings'"
            :title="t('navbar.userSettings')"
            @click="toggleDrawer('user-settings')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-panorama"
            :active="uiStore.activeDrawer === 'backgrounds'"
            :title="t('navbar.backgrounds')"
            @click="toggleDrawer('backgrounds')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-cubes"
            :active="uiStore.activeDrawer === 'extensions'"
            :title="t('navbar.extensions')"
            @click="toggleDrawer('extensions')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-face-smile"
            :active="uiStore.activeDrawer === 'persona'"
            :title="t('navbar.personaManagement')"
            @click="toggleDrawer('persona')"
          />
        </div>
        <div class="nav-item">
          <Button
            variant="ghost"
            icon="fa-address-card"
            :active="uiStore.activeDrawer === 'character'"
            :title="t('navbar.characterManagement')"
            @click="toggleDrawer('character')"
          />
        </div>
      </div>
    </div>

    <!-- Drawers -->
    <div class="nav-item-content" :class="{ active: uiStore.activeDrawer === 'ai-config' }">
      <AiConfigDrawer />
    </div>
    <div class="nav-item-content" :class="{ active: uiStore.activeDrawer === 'api-status' }">
      <ApiConnectionsDrawer />
    </div>
    <div class="nav-item-content" :class="{ active: uiStore.activeDrawer === 'formatting' }">
      <FormattingDrawer />
    </div>
    <div
      class="nav-item-content"
      :class="{ active: uiStore.activeDrawer === 'world-info', wide: uiStore.activeDrawer === 'world-info' }"
    >
      <WorldInfoDrawer />
    </div>
    <div class="nav-item-content" :class="{ active: uiStore.activeDrawer === 'user-settings' }">
      <UserSettingsDrawer />
    </div>
    <div class="nav-item-content" :class="{ active: uiStore.activeDrawer === 'backgrounds' }">
      <BackgroundsDrawer />
    </div>
    <div
      class="nav-item-content"
      :class="{ active: uiStore.activeDrawer === 'extensions', wide: uiStore.activeDrawer === 'extensions' }"
    >
      <ExtensionsDrawer />
    </div>
    <div
      class="nav-item-content"
      :class="{ active: uiStore.activeDrawer === 'persona', wide: uiStore.activeDrawer === 'persona' }"
    >
      <PersonaManagementDrawer />
    </div>
    <div
      class="nav-item-content"
      :class="{ active: uiStore.activeDrawer === 'character', wide: uiStore.activeDrawer === 'character' }"
    >
      <CharacterPanel />
    </div>
  </div>
</template>
