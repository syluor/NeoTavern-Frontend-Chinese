<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings.store';
import type { SettingDefinition } from '../../types';

const settingsStore = useSettingsStore();
const searchTerm = ref('');
const collapsedCategories = ref<string[]>([]);

const filteredDefinitions = computed(() => {
  if (!searchTerm.value.trim()) {
    return settingsStore.definitions;
  }
  const lowerCaseSearch = searchTerm.value.toLowerCase();
  return settingsStore.definitions.filter(
    (def) =>
      def.label.toLowerCase().includes(lowerCaseSearch) ||
      def.description?.toLowerCase().includes(lowerCaseSearch) ||
      def.category.toLowerCase().includes(lowerCaseSearch),
  );
});

const groupedSettings = computed(() => {
  const groups: Record<string, SettingDefinition[]> = {};
  for (const setting of filteredDefinitions.value) {
    if (!groups[setting.category]) {
      groups[setting.category] = [];
    }
    groups[setting.category].push(setting);
  }
  // Ensure consistent order
  const orderedGroups: Record<string, SettingDefinition[]> = {};
  const categoryOrder = [...new Set(settingsStore.definitions.map((def) => def.category))];
  for (const category of categoryOrder) {
    if (groups[category]) {
      orderedGroups[category] = groups[category];
    }
  }
  return orderedGroups;
});

function getSettingValue(id: string) {
  return settingsStore.getSetting(id);
}

function updateSetting(id: string, event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  let value: string | number | boolean = target.value;
  const definition = settingsStore.definitions.find((d) => d.id === id);

  if (definition?.type === 'boolean') {
    value = (target as HTMLInputElement).checked;
  } else if (definition?.type === 'number') {
    value = parseFloat(value);
  }

  settingsStore.setSetting(id, value);
}

function toggleCategoryCollapse(category: string) {
  const index = collapsedCategories.value.indexOf(category);
  if (index > -1) {
    collapsedCategories.value.splice(index, 1);
  } else {
    collapsedCategories.value.push(category);
  }
}

// --- Transition Hooks for Drawers ---
// Re-using the robust JS-driven height transition from other components
function beforeEnter(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.style.height = '0';
  el.style.opacity = '0';
  el.style.overflow = 'hidden';
}
function enter(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.getBoundingClientRect(); // Force repaint
  requestAnimationFrame(() => {
    el.style.height = `${el.scrollHeight}px`;
    el.style.opacity = '1';
  });
}
function afterEnter(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.style.height = '';
}
function beforeLeave(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.style.height = `${el.scrollHeight}px`;
  el.style.overflow = 'hidden';
}
function leave(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.getBoundingClientRect(); // Force repaint
  requestAnimationFrame(() => {
    el.style.height = '0';
    el.style.opacity = '0';
  });
}
function afterLeave(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.style.height = '';
  el.style.opacity = '0';
}
</script>

<template>
  <div class="user-settings-drawer">
    <div class="user-settings-drawer__header">
      <h3>User Settings</h3>
      <input
        type="search"
        class="text-pole user-settings-drawer__search"
        placeholder="Search Settings"
        v-model="searchTerm"
      />
      <!-- TODO: Implement Account/Admin/Logout buttons -->
    </div>

    <div class="user-settings-drawer__content">
      <div v-if="Object.keys(groupedSettings).length === 0" class="user-settings-drawer__no-results">
        No settings found.
      </div>
      <div v-for="(settings, category) in groupedSettings" :key="category" class="user-settings-drawer__category">
        <div class="user-settings-drawer__category-header" @click="toggleCategoryCollapse(category)">
          <h4>{{ category }}</h4>
          <i
            class="fa-solid fa-chevron-down user-settings-drawer__chevron"
            :class="{ 'is-collapsed': collapsedCategories.includes(category) }"
          ></i>
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
          <div v-show="!collapsedCategories.includes(category)">
            <div class="user-settings-drawer__category-content">
              <div v-for="setting in settings" :key="setting.id" class="user-settings-drawer__setting">
                <div class="setting-details">
                  <label :for="setting.id">{{ setting.label }}</label>
                  <small v-if="setting.description">{{ setting.description }}</small>
                </div>
                <div class="setting-control">
                  <!-- Checkbox -->
                  <label v-if="setting.widget === 'checkbox'" class="checkbox-label-wrapper">
                    <input
                      :id="setting.id"
                      type="checkbox"
                      :checked="getSettingValue(setting.id)"
                      @change="updateSetting(setting.id, $event)"
                    />
                  </label>

                  <!-- Select -->
                  <select
                    v-if="setting.widget === 'select'"
                    :id="setting.id"
                    class="text-pole"
                    :value="getSettingValue(setting.id)"
                    @change="updateSetting(setting.id, $event)"
                  >
                    <option v-for="option in setting.options" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>

                  <!-- Slider -->
                  <div v-if="setting.widget === 'slider'" class="slider-control">
                    <input
                      type="range"
                      :id="setting.id"
                      :min="setting.min"
                      :max="setting.max"
                      :step="setting.step"
                      :value="getSettingValue(setting.id)"
                      @input="updateSetting(setting.id, $event)"
                    />
                    <span class="slider-value">{{ getSettingValue(setting.id) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
