<script setup lang="ts">
import { ref } from 'vue';
import RightMenu from '../RightMenu/RightMenu.vue';

// Reactive state to control which drawer is open
const activeDrawer = ref<string | null>(null);

function toggleDrawer(drawerName: string) {
  if (activeDrawer.value === drawerName) {
    activeDrawer.value = null; // Close if already open
  } else {
    activeDrawer.value = drawerName; // Open the new one
  }
}
</script>

<template>
  <div>
    <div id="top-bar"></div>
    <div id="top-settings-holder">
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('ai-config')">
          <div class="drawer-icon fa-solid fa-sliders fa-fw" :class="{ active: activeDrawer === 'ai-config' }" title="AI Response Configuration"></div>
        </div>
        <div class="drawer-content fill-left" :class="{ active: activeDrawer === 'ai-config' }">
          <!-- AI Config Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('api-status')">
          <div class="drawer-icon fa-solid fa-plug fa-fw" :class="{ active: activeDrawer === 'api-status' }" title="API Connections"></div>
        </div>
        <div class="drawer-content" :class="{ active: activeDrawer === 'api-status' }">
          <!-- API Status Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('formatting')">
          <div class="drawer-icon fa-solid fa-font fa-fw" :class="{ active: activeDrawer === 'formatting' }" title="AI Response Formatting"></div>
        </div>
        <div class="drawer-content" :class="{ active: activeDrawer === 'formatting' }">
          <!-- Formatting Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('world-info')">
          <div class="drawer-icon fa-solid fa-book-atlas fa-fw" :class="{ active: activeDrawer === 'world-info' }" title="World Info"></div>
        </div>
        <div class="drawer-content" :class="{ active: activeDrawer === 'world-info' }">
          <!-- World Info Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('user-settings')">
          <div class="drawer-icon fa-solid fa-user-cog fa-fw" :class="{ active: activeDrawer === 'user-settings' }" title="User Settings"></div>
        </div>
        <div class="drawer-content" :class="{ active: activeDrawer === 'user-settings' }">
          <!-- User Settings Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('backgrounds')">
          <div class="drawer-icon fa-solid fa-panorama fa-fw" :class="{ active: activeDrawer === 'backgrounds' }" title="Change Background Image"></div>
        </div>
        <div class="drawer-content" :class="{ active: activeDrawer === 'backgrounds' }">
          <!-- Backgrounds Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('extensions')">
          <div class="drawer-icon fa-solid fa-cubes fa-fw" :class="{ active: activeDrawer === 'extensions' }" title="Extensions"></div>
        </div>
        <div class="drawer-content" :class="{ active: activeDrawer === 'extensions' }">
          <!-- Extensions Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('persona')">
          <div class="drawer-icon fa-solid fa-face-smile fa-fw" :class="{ active: activeDrawer === 'persona' }" title="Persona Management"></div>
        </div>
        <div class="drawer-content" :class="{ active: activeDrawer === 'persona' }">
          <!-- Persona Management Content -->
        </div>
      </div>
      <div class="drawer">
        <div class="drawer-toggle drawer-header" @click="toggleDrawer('character')">
          <div class="drawer-icon fa-solid fa-address-card fa-fw" :class="{ active: activeDrawer === 'character' }" title="Character Management"></div>
        </div>
        <div class="drawer-content fill-right" :class="{ active: activeDrawer === 'character' }">
          <RightMenu />
        </div>
      </div>
    </div>
  </div>
</template>