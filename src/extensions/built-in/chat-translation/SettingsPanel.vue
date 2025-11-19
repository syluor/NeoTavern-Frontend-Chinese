<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { ExtensionAPI } from '@/types';
import { AutoTranslateMode, type ChatTranslationSettings, DEFAULT_PROMPT } from './types';
import ConnectionProfileSelector from '@/components/Common/ConnectionProfileSelector.vue';
import { useStrictI18n } from '@/composables/useStrictI18n';

const props = defineProps<{
  api: ExtensionAPI;
}>();

const { t } = useStrictI18n();

const settings = ref<ChatTranslationSettings>({
  connectionProfile: undefined,
  sourceLang: 'Auto',
  targetLang: 'English',
  autoMode: AutoTranslateMode.NONE,
  prompt: DEFAULT_PROMPT,
});

onMounted(() => {
  const saved = props.api.settings.get();
  if (saved) {
    settings.value = { ...settings.value, ...saved };
  }
});

watch(
  settings,
  (newSettings) => {
    props.api.settings.set(undefined, newSettings);
    props.api.settings.save();
  },
  { deep: true },
);

function resetPrompt() {
  settings.value.prompt = DEFAULT_PROMPT;
}
</script>

<template>
  <div class="translation-settings">
    <div class="setting-item">
      <label>{{ t('extensionsBuiltin.chat_translation.connection_profile') }}</label>
      <ConnectionProfileSelector v-model="settings.connectionProfile" />
      <small>{{ t('extensionsBuiltin.chat_translation.connection_profile_hint') }}</small>
    </div>

    <div class="setting-row">
      <div class="setting-item">
        <label>{{ t('extensionsBuiltin.chat_translation.source_lang') }}</label>
        <input type="text" v-model="settings.sourceLang" class="text-pole" />
      </div>
      <div class="setting-item">
        <label>{{ t('extensionsBuiltin.chat_translation.target_lang') }}</label>
        <input type="text" v-model="settings.targetLang" class="text-pole" />
      </div>
    </div>

    <div class="setting-item">
      <label>{{ t('extensionsBuiltin.chat_translation.auto_mode.label') }}</label>
      <select v-model="settings.autoMode" class="text-pole">
        <option :value="AutoTranslateMode.NONE">{{ t('extensionsBuiltin.chat_translation.auto_mode.none') }}</option>
        <option :value="AutoTranslateMode.RESPONSES">
          {{ t('extensionsBuiltin.chat_translation.auto_mode.responses') }}
        </option>
        <option :value="AutoTranslateMode.INPUTS">
          {{ t('extensionsBuiltin.chat_translation.auto_mode.inputs') }}
        </option>
        <option :value="AutoTranslateMode.BOTH">{{ t('extensionsBuiltin.chat_translation.auto_mode.both') }}</option>
      </select>
    </div>

    <div class="setting-item">
      <div class="header-row">
        <label>{{ t('extensionsBuiltin.chat_translation.prompt_template') }}</label>
        <button class="menu-button" @click="resetPrompt">
          <i class="fa-solid fa-rotate-left"></i> {{ t('common.reset') }}
        </button>
      </div>
      <textarea v-model="settings.prompt" class="text-pole prompt-area" rows="10"></textarea>
      <small>{{ t('extensionsBuiltin.chat_translation.prompt_hint') }}</small>
    </div>
  </div>
</template>

<style scoped>
.translation-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.setting-row {
  display: flex;
  gap: 10px;
}

.setting-row .setting-item {
  flex: 1;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompt-area {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
}

label {
  font-weight: bold;
  opacity: 0.9;
}

small {
  opacity: 0.6;
  font-size: 0.85em;
}
</style>
