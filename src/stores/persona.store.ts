import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSettingsStore } from './settings.store';
import { useUiStore } from './ui.store';
import { fetchAllPersonaAvatars, deletePersonaAvatar, uploadPersonaAvatar } from '../api/personas';
import { type Persona, type PersonaDescription, POPUP_TYPE, POPUP_RESULT } from '../types';
import { toast } from '../composables/useToast';
import { useStrictI18n } from '../composables/useStrictI18n';
import { usePopupStore } from './popup.store';
import { getBase64Async } from '../utils/file';

export const usePersonaStore = defineStore('persona', () => {
  const { t } = useStrictI18n();
  const settingsStore = useSettingsStore();
  const uiStore = useUiStore();
  const popupStore = usePopupStore();

  const allPersonaAvatars = ref<string[]>([]);
  const activePersonaId = ref<string | null>(null);
  const lastAvatarUpdate = ref(Date.now());

  const personas = computed<Persona[]>(() => {
    const personaNames = settingsStore.settings.persona.personas ?? {};
    const personaDescriptions = settingsStore.settings.persona.personaDescriptions ?? {};

    return allPersonaAvatars.value.map((avatarId) => {
      const descriptionData = personaDescriptions[avatarId] || createDefaultDescription();
      return {
        ...descriptionData,
        avatarId: avatarId,
        name: personaNames[avatarId] ?? '[Unnamed Persona]',
      };
    });
  });

  const activePersona = computed<Persona | null>(() => {
    return personas.value.find((p) => p.avatarId === activePersonaId.value) ?? null;
  });

  async function initialize() {
    await refreshPersonas();
    const defaultPersona = settingsStore.settings.persona.defaultPersona;
    if (defaultPersona && allPersonaAvatars.value.includes(defaultPersona)) {
      await setActivePersona(defaultPersona);
    } else if (personas.value.length > 0) {
      await setActivePersona(personas.value[0].avatarId);
    }
  }

  async function refreshPersonas() {
    try {
      allPersonaAvatars.value = await fetchAllPersonaAvatars();
      // Ensure every avatar has a corresponding entry in settings
      const personaSettings = { ...(settingsStore.settings.persona.personas ?? {}) };
      const descriptions = { ...(settingsStore.settings.persona.personaDescriptions ?? {}) };
      let settingsChanged = false;

      for (const avatarId of allPersonaAvatars.value) {
        if (!personaSettings[avatarId]) {
          personaSettings[avatarId] = '[Unnamed Persona]';
          settingsChanged = true;
        }
        if (!descriptions[avatarId]) {
          descriptions[avatarId] = createDefaultDescription();
          settingsChanged = true;
        }
      }
      if (settingsChanged) {
        settingsStore.setSetting('persona.personas', personaSettings);
        settingsStore.setSetting('persona.personaDescriptions', descriptions);
      }
    } catch (error) {
      console.error('Failed to refresh personas:', error);
      toast.error('Could not load personas.');
    }
  }

  function createDefaultDescription(): PersonaDescription {
    return {
      description: '',
      position: 0, // In Prompt
      depth: 2,
      role: 'system',
      lorebook: '',
      connections: [],
      title: '',
    };
  }

  async function setActivePersona(avatarId: string | null) {
    if (!avatarId) return;
    const persona = personas.value.find((p) => p.avatarId === avatarId);
    if (persona) {
      activePersonaId.value = avatarId;
      uiStore.activePlayerName = persona.name;
      uiStore.activePlayerAvatar = persona.avatarId;
      // Sync back to legacy fields for compatibility with other parts of the app
      settingsStore.setLegacySetting('username', persona.name);
      settingsStore.setLegacySetting('user_avatar', persona.avatarId);
    }
  }

  function updateActivePersonaField<K extends keyof PersonaDescription>(field: K, value: PersonaDescription[K]) {
    if (!activePersonaId.value) return;
    const newDescriptions = { ...(settingsStore.settings.persona.personaDescriptions ?? {}) };
    if (newDescriptions[activePersonaId.value]) {
      newDescriptions[activePersonaId.value][field] = value;
      settingsStore.setSetting('persona.personaDescriptions', newDescriptions);
    }
  }

  async function updateActivePersonaName() {
    if (!activePersona.value) return;

    const { result, value: newName } = await popupStore.show({
      title: t('personaManagement.rename.title'),
      content: t('personaManagement.rename.prompt'),
      type: POPUP_TYPE.INPUT,
      inputValue: activePersona.value.name,
    });

    if (result === POPUP_RESULT.AFFIRMATIVE && newName && activePersonaId.value) {
      const currentPersonas = { ...(settingsStore.settings.persona.personas ?? {}) };
      currentPersonas[activePersonaId.value] = newName;
      settingsStore.setSetting('persona.personas', currentPersonas);
      // also update the main username if this is the active persona
      uiStore.activePlayerName = newName;
      settingsStore.setLegacySetting('username', newName);
    }
  }

  async function changeActivePersonaAvatar(file: File) {
    if (!activePersonaId.value) return;

    let cropData;
    if (!settingsStore.settings.ui.avatars.neverResize) {
      const dataUrl = await getBase64Async(file);
      const { result, value } = await popupStore.show({
        title: t('popup.cropAvatar.title'),
        type: POPUP_TYPE.CROP,
        cropImage: dataUrl,
        wide: true,
      });
      if (result !== POPUP_RESULT.AFFIRMATIVE) return;
      cropData = value;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('overwrite_name', activePersonaId.value);

    try {
      await uploadPersonaAvatar(formData, cropData);
      lastAvatarUpdate.value = Date.now();
      toast.success('Avatar updated successfully.');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to update avatar.');
    }
  }

  async function deletePersona(avatarId: string) {
    try {
      await deletePersonaAvatar(avatarId);

      const newPersonas = { ...(settingsStore.settings.persona.personas ?? {}) };
      delete newPersonas[avatarId];
      settingsStore.setSetting('persona.personas', newPersonas);

      const newDescriptions = { ...(settingsStore.settings.persona.personaDescriptions ?? {}) };
      delete newDescriptions[avatarId];
      settingsStore.setSetting('persona.personaDescriptions', newDescriptions);

      if (settingsStore.settings.persona.defaultPersona === avatarId) {
        settingsStore.setSetting('persona.defaultPersona', null);
      }
      // TODO: Handle chat and character locks

      toast.success(t('personaManagement.delete.success'));
      await refreshPersonas();

      if (activePersonaId.value === avatarId) {
        const nextPersona = personas.value.length > 0 ? personas.value[0].avatarId : null;
        await setActivePersona(nextPersona);
      }
    } catch (error) {
      console.error('Failed to delete persona:', error);
      toast.error(t('personaManagement.delete.error'));
    }
  }

  return {
    personas,
    activePersonaId,
    activePersona,
    lastAvatarUpdate,
    initialize,
    refreshPersonas,
    setActivePersona,
    updateActivePersonaField,
    updateActivePersonaName,
    changeActivePersonaAvatar,
    deletePersona,
  };
});
