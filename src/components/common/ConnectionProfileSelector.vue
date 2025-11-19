<script setup lang="ts">
import { useApiStore } from '../../stores/api.store';
import { useStrictI18n } from '../../composables/useStrictI18n';
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const { t } = useStrictI18n();
const apiStore = useApiStore();

const selectedProfile = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <select v-model="selectedProfile" class="text-pole">
    <option :value="undefined">{{ t('apiConnections.profileManagement.none') }}</option>
    <option v-for="profile in apiStore.connectionProfiles" :key="profile.name" :value="profile.name">
      {{ profile.name }}
    </option>
  </select>
</template>
