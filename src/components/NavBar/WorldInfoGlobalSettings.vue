<script setup lang="ts">
import { computed } from 'vue';
import { useWorldInfoStore, defaultWorldInfoSettings } from '../../stores/world-info.store';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { WorldInfoInsertionStrategy } from '../../types';
import { Button, Checkbox, Select, RangeControl } from '../UI';
import FormItem from '../UI/FormItem.vue';

const { t } = useStrictI18n();
const worldInfoStore = useWorldInfoStore();

function resetToDefaults() {
  worldInfoStore.settings = { ...defaultWorldInfoSettings };
}

const strategyOptions = computed(() => [
  { value: WorldInfoInsertionStrategy.EVENLY, label: t('worldInfo.insertionStrategies.sortedEvenly') },
  { value: WorldInfoInsertionStrategy.CHARACTER_FIRST, label: t('worldInfo.insertionStrategies.characterLoreFirst') },
  { value: WorldInfoInsertionStrategy.GLOBAL_FIRST, label: t('worldInfo.insertionStrategies.globalLoreFirst') },
]);

const bookOptions = computed(() => {
  return worldInfoStore.bookNames.map((name) => ({
    label: name,
    value: name,
  }));
});
</script>

<template>
  <div class="world-info-global-settings">
    <div class="editor-header">
      <h3>{{ t('worldInfo.globalSettings') }}</h3>
      <Button @click="resetToDefaults">{{ t('common.resetToDefaults') }}</Button>
    </div>

    <div class="settings-section">
      <FormItem :description="t('worldInfo.activeWorldsHint')">
        <Select
          v-model="worldInfoStore.activeBookNames"
          :options="bookOptions"
          multiple
          :label="t('worldInfo.activeWorlds')"
          :placeholder="t('common.none')"
        />
      </FormItem>
    </div>

    <hr />

    <div class="settings-section">
      <h4>{{ t('worldInfo.activationSettings') }}</h4>
      <div class="wi-settings-grid">
        <div class="wi-settings-grid-sliders">
          <RangeControl
            v-model="worldInfoStore.settings.world_info_depth"
            :label="t('worldInfo.scanDepth')"
            :min="0"
            :max="1000"
          />
          <RangeControl
            v-model="worldInfoStore.settings.world_info_budget"
            :label="t('worldInfo.contextPercent')"
            :min="1"
            :max="100"
          />
          <RangeControl
            v-model="worldInfoStore.settings.world_info_budget_cap"
            :label="t('worldInfo.budgetCap')"
            :min="0"
            :max="65536"
            :title="t('worldInfo.budgetCapHint')"
          />
        </div>
        <div class="wi-settings-grid-checkboxes">
          <Checkbox
            v-model="worldInfoStore.settings.world_info_include_names"
            :label="t('worldInfo.includeNames')"
            :title="t('worldInfo.includeNamesHint')"
          />
          <Checkbox
            v-model="worldInfoStore.settings.world_info_recursive"
            :label="t('worldInfo.recursiveScan')"
            :title="t('worldInfo.recursiveScanHint')"
          />
          <Checkbox
            v-model="worldInfoStore.settings.world_info_case_sensitive"
            :label="t('worldInfo.caseSensitive')"
            :title="t('worldInfo.caseSensitiveHint')"
          />
          <Checkbox
            v-model="worldInfoStore.settings.world_info_match_whole_words"
            :label="t('worldInfo.matchWholeWords')"
            :title="t('worldInfo.matchWholeWordsHint')"
          />
          <Checkbox
            v-model="worldInfoStore.settings.world_info_use_group_scoring"
            :label="t('worldInfo.useGroupScoring')"
            :title="t('worldInfo.useGroupScoringHint')"
          />
          <Checkbox
            v-model="worldInfoStore.settings.world_info_overflow_alert"
            :label="t('worldInfo.alertOnOverflow')"
            :title="t('worldInfo.alertOnOverflowHint')"
          />
        </div>
      </div>
    </div>

    <hr />

    <div class="settings-section">
      <h4>{{ t('worldInfo.advancedSettings') }}</h4>
      <FormItem>
        <Select
          v-model="worldInfoStore.settings.world_info_character_strategy"
          :label="t('worldInfo.insertionStrategy')"
          :title="t('worldInfo.insertionStrategyHint')"
          :options="strategyOptions"
        />
      </FormItem>
    </div>
  </div>
</template>
