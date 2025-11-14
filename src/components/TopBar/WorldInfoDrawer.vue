<script setup lang="ts">
import { onMounted } from 'vue';
import { useWorldInfoStore } from '../../stores/world-info.store';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { slideTransitionHooks } from '../../utils/dom';
import WorldInfoEntry from './WorldInfoEntry.vue';
import type { WorldInfoEntry as WorldInfoEntryType } from '../../types';

const { t } = useStrictI18n();
const worldInfoStore = useWorldInfoStore();

const { beforeEnter, enter, afterEnter, beforeLeave, leave } = slideTransitionHooks;

onMounted(() => {
  worldInfoStore.initialize();
});

function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // TODO: Call store action to import
    console.log('Importing file:', file.name);
  }
  if (target) {
    target.value = '';
  }
}

function updateEntry(index: number, newEntry: WorldInfoEntryType) {
  if (worldInfoStore.editingBook && worldInfoStore.editingBook.entries) {
    worldInfoStore.editingBook.entries[index] = newEntry;
    worldInfoStore.saveEditingBookDebounced();
  }
}
</script>

<template>
  <div class="world-info-drawer">
    <div class="world-info-drawer__header">
      <div
        :title="t('worldInfo.pinToggle')"
        class="menu-button-icon"
        :class="worldInfoStore.isPanelPinned ? 'fa-lock' : 'fa-unlock'"
        @click="worldInfoStore.isPanelPinned = !worldInfoStore.isPanelPinned"
      ></div>
      <h3>
        <span>{{ t('worldInfo.title') }}</span>
        <a
          href="https://docs.sillytavern.app/usage/core-concepts/worldinfo/"
          class="notes-link"
          target="_blank"
          :title="t('worldInfo.docsLink')"
        >
          <span class="fa-solid fa-circle-question note-link-span"></span>
        </a>
      </h3>
    </div>

    <div class="world-info-drawer__content">
      <div class="world-info-drawer__section">
        <!-- Active Worlds Selector -->
        <div class="range-block">
          <div class="range-block-title">
            <small>{{ t('worldInfo.activeWorlds') }}</small>
          </div>
          <!-- TODO: Replace with a proper multi-select component later -->
          <select class="text-pole" multiple v-model="worldInfoStore.activeBookNames" style="min-height: 80px">
            <option v-for="name in worldInfoStore.bookNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>

        <!-- Global Settings -->
        <div class="range-block">
          <div class="range-block-title">
            <small>{{ t('worldInfo.globalSettings') }}</small>
          </div>
          <div class="inline-drawer">
            <div
              class="standoutHeader inline-drawer-header"
              @click="worldInfoStore.isSettingsExpanded = !worldInfoStore.isSettingsExpanded"
            >
              <b>{{ t('worldInfo.expand') }}</b>
              <div
                class="fa-solid fa-circle-chevron-down inline-drawer-icon"
                :class="{ 'is-open': worldInfoStore.isSettingsExpanded }"
              ></div>
            </div>
            <transition
              name="slide-js"
              @before-enter="beforeEnter"
              @enter="enter"
              @after-enter="afterEnter"
              @before-leave="beforeLeave"
              @leave="leave"
            >
              <div v-show="worldInfoStore.isSettingsExpanded" class="inline-drawer-content">
                <div class="wi-settings-grid">
                  <div class="wi-settings-grid__sliders">
                    <!-- Sliders -->
                    <div class="range-block">
                      <div class="range-block-title">{{ t('worldInfo.scanDepth') }}</div>
                      <div class="range-block-range-and-counter">
                        <input
                          type="range"
                          class="neo-range-slider"
                          min="0"
                          max="1000"
                          step="1"
                          v-model.number="worldInfoStore.settings.world_info_depth"
                        />
                        <input
                          type="number"
                          class="neo-range-input"
                          min="0"
                          max="1000"
                          step="1"
                          v-model.number="worldInfoStore.settings.world_info_depth"
                        />
                      </div>
                    </div>
                    <div class="range-block">
                      <div class="range-block-title">{{ t('worldInfo.contextPercent') }}</div>
                      <div class="range-block-range-and-counter">
                        <input
                          type="range"
                          class="neo-range-slider"
                          min="1"
                          max="100"
                          step="1"
                          v-model.number="worldInfoStore.settings.world_info_budget"
                        />
                        <input
                          type="number"
                          class="neo-range-input"
                          min="1"
                          max="100"
                          step="1"
                          v-model.number="worldInfoStore.settings.world_info_budget"
                        />
                      </div>
                    </div>
                    <!-- ... TODO: There should be more ... -->
                  </div>
                  <div class="wi-settings-grid__checkboxes">
                    <!-- Checkboxes -->
                    <label class="checkbox-label" :title="t('worldInfo.includeNamesHint')">
                      <input type="checkbox" v-model="worldInfoStore.settings.world_info_include_names" />
                      <span>{{ t('worldInfo.includeNames') }}</span>
                    </label>
                    <label class="checkbox-label" :title="t('worldInfo.recursiveScanHint')">
                      <input type="checkbox" v-model="worldInfoStore.settings.world_info_recursive" />
                      <span>{{ t('worldInfo.recursiveScan') }}</span>
                    </label>
                    <label class="checkbox-label" :title="t('worldInfo.caseSensitiveHint')">
                      <input type="checkbox" v-model="worldInfoStore.settings.world_info_case_sensitive" />
                      <span>{{ t('worldInfo.caseSensitive') }}</span>
                    </label>
                    <label class="checkbox-label" :title="t('worldInfo.matchWholeWordsHint')">
                      <input type="checkbox" v-model="worldInfoStore.settings.world_info_match_whole_words" />
                      <span>{{ t('worldInfo.matchWholeWords') }}</span>
                    </label>
                    <label class="checkbox-label" :title="t('worldInfo.useGroupScoringHint')">
                      <input type="checkbox" v-model="worldInfoStore.settings.world_info_use_group_scoring" />
                      <span>{{ t('worldInfo.useGroupScoring') }}</span>
                    </label>
                    <label class="checkbox-label" :title="t('worldInfo.alertOnOverflowHint')">
                      <input type="checkbox" v-model="worldInfoStore.settings.world_info_overflow_alert" />
                      <span>{{ t('worldInfo.alertOnOverflow') }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <hr />

      <!-- World Editor Section -->
      <div class="world-editor">
        <div class="world-editor__controls">
          <div class="menu-button">
            <i class="fa-solid fa-globe"></i>
            <span>{{ t('worldInfo.newWorld') }}</span>
          </div>
          <small>{{ t('worldInfo.or') }}</small>
          <select
            class="text-pole"
            :value="worldInfoStore.editingBookName"
            @change="worldInfoStore.selectBookForEditing(($event.target as HTMLSelectElement).value)"
          >
            <option :value="null">{{ t('worldInfo.pickToEdit') }}</option>
            <option v-for="name in worldInfoStore.bookNames" :key="name" :value="name">{{ name }}</option>
          </select>
          <label class="menu-button fa-solid fa-file-import" :title="t('worldInfo.import')">
            <input type="file" @change="handleFileImport" accept=".json,.lorebook,.png" hidden />
          </label>
          <div class="menu-button fa-solid fa-file-export" :title="t('worldInfo.export')"></div>
          <div class="menu-button fa-solid fa-pencil" :title="t('worldInfo.rename')"></div>
          <div class="menu-button fa-solid fa-paste" :title="t('worldInfo.duplicate')"></div>
          <div class="menu-button fa-solid fa-trash-can redWarningBG" :title="t('worldInfo.delete')"></div>
        </div>

        <!-- Entry Editor (if a book is selected) -->
        <div v-if="worldInfoStore.editingBook" class="world-editor__entries">
          <div class="world-editor__entries-controls">
            <!-- TODO: New Entry, Open/Close all, Search, Sort, Pagination -->
            <div class="menu-button fa-solid fa-plus" :title="t('worldInfo.newEntry')"></div>
            <div class="menu-button fa-solid fa-expand" :title="t('worldInfo.openAllEntries')"></div>
            <div class="menu-button fa-solid fa-compress" :title="t('worldInfo.closeAllEntries')"></div>
            <input
              type="search"
              class="text-pole"
              :placeholder="t('worldInfo.searchPlaceholder')"
              v-model="worldInfoStore.searchTerm"
            />
            <select class="text-pole" v-model="worldInfoStore.sortOrder">
              <option value="priority">{{ t('worldInfo.sorting.priority') }}</option>
              <option value="title:asc">{{ t('worldInfo.sorting.titleAsc') }}</option>
              <!-- ... TODO: more sort options -->
            </select>
            <div class="menu-button fa-solid fa-arrows-rotate" :title="t('worldInfo.refresh')"></div>
          </div>
          <div class="world-editor__entries-list">
            <WorldInfoEntry
              v-for="(entry, index) in worldInfoStore.filteredEntries"
              :key="entry.uid"
              :model-value="entry"
              @update:model-value="(newEntry) => updateEntry(index, newEntry)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
