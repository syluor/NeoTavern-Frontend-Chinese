import { createApp } from 'vue';
import { useChatStore } from '../stores/chat.store';
import { useSettingsStore } from '../stores/settings.store';
import { useCharacterStore } from '../stores/character.store';
import { usePersonaStore } from '../stores/persona.store';
import { useUiStore } from '../stores/ui.store';
import { usePopupStore } from '../stores/popup.store';
import { toast } from '../composables/useToast';
import { ChatCompletionService, buildChatCompletionPayload } from '../api/generation';
import {
  type Character,
  type ChatMessage,
  type Settings,
  type SettingsPath,
  type Persona,
  type MenuType,
  type SamplerSettings,
  type PersonaDescription,
  type WorldInfoSettings,
  type WorldInfoBook,
  type WorldInfoEntry,
  type LlmGenerationOptions,
  type PopupShowOptions,
  type ApiChatMessage,
  type ChatCompletionPayload,
  type GenerationResponse,
  type StreamedChunk,
  type ExtensionAPI,
} from '../types';
import type { ValueForPath } from '../types/utils';
import { eventEmitter } from './event-emitter';
import { getMessageTimeStamp } from './date';
import { PromptBuilder } from './prompt-builder';
import { WorldInfoProcessor } from './world-info-processor';
import { useApiStore } from '../stores/api.store';
import { useWorldInfoStore } from '../stores/world-info.store';

import * as Vue from 'vue';
import i18n from '../i18n';
import pinia from '../stores';
import { GenerationMode } from '../constants';

/**
 * A registry of standard, mountable Vue components that can be used by extensions.
 * We use dynamic imports to avoid circular dependencies and load components on demand.
 */
const mountableComponents: Record<string, () => Promise<any>> = {
  ConnectionProfileSelector: () => import('../components/Common/ConnectionProfileSelector.vue'),
};

/**
 * The public API exposed to extensions.
 * This facade provides controlled access to the application's state and actions,
 * ensuring stability and preventing extensions from breaking on internal refactors.
 */
const baseExtensionAPI: ExtensionAPI = {
  /**
   * Functions related to chat management.
   */
  chat: {
    /**
     * Sends a message to the current chat as the user.
     * @param messageText The content of the message to send.
     * @param options Configuration for sending the message.
     * @param options.triggerGeneration If true (default), an AI response will be generated.
     * @returns A promise that resolves when the message is sent (and generation begins, if applicable).
     */
    sendMessage: async (messageText: string, options?: { triggerGeneration?: boolean }): Promise<void> => {
      // We get the store instance inside the function call to ensure Pinia is initialized.
      const shouldTriggerGeneration = options?.triggerGeneration ?? true;
      await useChatStore().sendMessage(messageText, shouldTriggerGeneration);
    },

    /**
     * Gets the entire chat history for the active chat.
     * @returns A deep copy of the chat messages array to prevent direct state mutation.
     */
    getHistory: (): ChatMessage[] => {
      return JSON.parse(JSON.stringify(useChatStore().chat));
    },

    /**
     * Gets the last message in the chat history.
     * @returns A deep copy of the last ChatMessage, or null if the chat is empty.
     */
    getLastMessage: (): ChatMessage | null => {
      const store = useChatStore();
      const lastMessage = store.chat.length > 0 ? store.chat[store.chat.length - 1] : null;
      return lastMessage ? JSON.parse(JSON.stringify(lastMessage)) : null;
    },

    /**
     * Inserts a message object into the chat history at a specific index without saving or triggering generation.
     * This action will trigger an automatic debounced save.
     * Useful for system messages or temporary notifications within the chat.
     * @param message The ChatMessage object to insert. 'send_date' will be added if missing.
     * @param index The index at which to insert the message. Defaults to the end.
     */
    insertMessage: (message: Omit<ChatMessage, 'send_date'> & { send_date?: string }, index?: number): void => {
      const store = useChatStore();
      const fullMessage: ChatMessage = { ...message, send_date: message.send_date ?? getMessageTimeStamp() };
      if (index === undefined || index < 0 || index >= store.chat.length) {
        store.chat.push(fullMessage);
      } else {
        store.chat.splice(index, 0, fullMessage);
      }
    },

    /**
     * Updates a message at a given index. This action saves the chat automatically.
     * @param index The index of the message to update.
     * @param newContent The new text content for the message.
     * @param newReasoning Optional new reasoning content for the message.
     */
    updateMessage: async (index: number, newContent: string, newReasoning?: string): Promise<void> => {
      const store = useChatStore();
      store.startEditing(index);
      await store.saveMessageEdit(newContent, newReasoning);
    },

    /**
     * Updates a message object at a given index with a set of partial updates. This action saves the chat automatically.
     * @param index The index of the message to update.
     * @param updates A partial ChatMessage object with the fields to update.
     */
    updateMessageObject: async (index: number, updates: Partial<ChatMessage>): Promise<void> => {
      return await useChatStore().updateMessageObject(index, updates);
    },

    /**
     * Deletes a message at a given index. This action saves the chat automatically.
     * @param index The index of the message to delete.
     */
    deleteMessage: async (index: number): Promise<void> => {
      await useChatStore().deleteMessage(index);
    },

    /**
     * Triggers a regeneration of the last AI response.
     */
    regenerateResponse: async (): Promise<void> => {
      return await useChatStore().generateResponse(GenerationMode.REGENERATE);
    },

    /**
     * Triggers a "continue" generation from the last AI response.
     */
    continueResponse: async (): Promise<void> => {
      return await useChatStore().generateResponse(GenerationMode.CONTINUE);
    },

    /**
     * Clears the entire chat history for the active chat and saves.
     * The character's first message will be recreated.
     */
    clear: async (): Promise<void> => {
      return await useChatStore().clearChat(true);
    },

    /**
     * Aborts any ongoing AI message generation.
     */
    abortGeneration: (): void => {
      useChatStore().abortGeneration();
    },

    /**
     * A direct, low-level interface to the chat completion service.
     * Use this for custom generation logic. Prefer `extensionAPI.llm.generate` for background tasks.
     * @param payload The payload for the generation request. See `ChatCompletionPayload`.
     * @param signal An optional AbortSignal to cancel the request.
     * @returns A Promise that resolves to a GenerationResponse or a stream generator function.
     */
    generate: (
      payload: ChatCompletionPayload,
      signal?: AbortSignal,
    ): Promise<GenerationResponse | (() => AsyncGenerator<StreamedChunk>)> => {
      return ChatCompletionService.generate(payload, signal);
    },

    /**
     * Builds a chat completion payload using the current application state (active model, settings, etc.).
     * @param messages The array of messages to include in the payload.
     * @param samplerOverrides Optional overrides for the current sampler settings.
     * @returns A fully constructed ChatCompletionPayload object.
     */
    buildPayload: (messages: ApiChatMessage[], samplerOverrides?: Partial<SamplerSettings>): ChatCompletionPayload => {
      const settingsStore = useSettingsStore();
      const apiStore = useApiStore();
      const characterStore = useCharacterStore();
      const uiStore = useUiStore();

      const samplerSettings = { ...settingsStore.settings.api.samplers, ...samplerOverrides };
      const source = settingsStore.settings.api.chat_completion_source;
      const model = apiStore.activeModel;
      const providerSpecific = settingsStore.settings.api.provider_specific;
      const playerName = uiStore.activePlayerName || 'User';
      const characterName = characterStore.activeCharacter?.name || '';
      const modelList = apiStore.modelList;

      if (!model) {
        throw new Error('No active model selected.');
      }

      return buildChatCompletionPayload({
        samplerSettings,
        messages,
        model,
        source,
        providerSpecific,
        playerName,
        characterName,
        modelList,
      });
    },

    /** The PromptBuilder class, for advanced prompt construction. */
    PromptBuilder: PromptBuilder,
    /** The WorldInfoProcessor class, for advanced lorebook processing. */
    WorldInfoProcessor: WorldInfoProcessor,
  },

  /**
   * Functions for reading and writing application settings.
   */
  settings: {
    /**
     * (SCOPED) Retrieves a setting value from this extension's dedicated storage.
     * @param path The key for the setting within the extension's scope.
     * @returns The value of the setting.
     */
    get: (path: string): any => {
      // This is a placeholder; it will be replaced by the scoped proxy.
      console.warn('[ExtensionAPI] settings.get called outside of a registered extension scope.');
      return undefined;
    },

    /**
     * (GLOBAL, READ-ONLY) Retrieves a setting value from the main application settings.
     * @param path The dot-notation path to the global setting (e.g., 'chat.sendOnEnter').
     * @returns The value of the setting.
     */
    getGlobal: <P extends SettingsPath>(path: P): ValueForPath<Settings, P> => {
      const value = useSettingsStore().getSetting(path);
      if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value));
      }
      return value;
    },

    /**
     * (SCOPED) Updates a single setting value in this extension's dedicated storage.
     * @param path The key for the setting within the extension's scope.
     * @param value The new value to set.
     */
    set: (path: string, value: any): void => {
      // This is a placeholder; it will be replaced by the scoped proxy.
      console.warn('[ExtensionAPI] settings.set called outside of a registered extension scope.');
    },

    /**
     * (GLOBAL, READ-ONLY) Retrieves a setting value from the main application settings.
     * @param path The dot-notation path to the global setting (e.g., 'chat.sendOnEnter').
     * @returns The value of the setting.
     */
    setGlobal: <P extends SettingsPath>(path: P, value: ValueForPath<Settings, P>): void => {
      useSettingsStore().setSetting(path, value);
    },

    /**
     * Triggers a debounced save of all settings.
     */
    save: (): void => {
      useSettingsStore().saveSettingsDebounced();
    },
  },

  /**
   * Functions related to characters.
   */
  character: {
    /**
     * Gets the currently active character object.
     * @returns A deep copy of the active character, or null if none is active.
     */
    getActive: (): Character | null => {
      const character = useCharacterStore().activeCharacter;
      return character ? JSON.parse(JSON.stringify(character)) : null;
    },

    /**
     * Gets a list of all available characters.
     * @returns A deep copy of the characters array.
     */
    getAll: (): Character[] => {
      return JSON.parse(JSON.stringify(useCharacterStore().characters));
    },

    /**
     * Sets the active character by its avatar filename.
     * @param avatar The unique avatar filename of the character to activate.
     * @returns A promise that resolves when the character is selected.
     */
    setActive: async (avatar: string): Promise<void> => {
      const store = useCharacterStore();
      const index = store.characters.findIndex((c) => c.avatar === avatar);
      if (index > -1) {
        await store.selectCharacterById(index);
      } else {
        throw new Error(`Character with avatar "${avatar}" not found.`);
      }
    },

    /**
     * Updates the currently active character with new data.
     * This triggers a debounced save.
     * @param data A partial character object with the fields to update.
     */
    updateActive: (data: Partial<Character>): void => {
      const store = useCharacterStore();
      if (store.activeCharacter) {
        store.saveCharacterDebounced(data);
      } else {
        console.warn('[ExtensionAPI] No active character to update.');
      }
    },
  },

  /**
   * Functions related to user personas.
   */
  persona: {
    /**
     * Gets the currently active persona object.
     * @returns A deep copy of the active persona, or null if none is active.
     */
    getActive: (): Persona | null => {
      const persona = usePersonaStore().activePersona;
      return persona ? JSON.parse(JSON.stringify(persona)) : null;
    },

    /**
     * Gets a list of all available personas.
     * @returns A deep copy of the personas array.
     */
    getAll: (): Persona[] => {
      return JSON.parse(JSON.stringify(usePersonaStore().personas));
    },

    /**
     * Sets the active persona by its avatarId.
     * @param avatarId The unique avatar ID of the persona to activate.
     */
    setActive: (avatarId: string): void => {
      usePersonaStore().setActivePersona(avatarId);
    },

    /**
     * Updates a field on the currently active persona.
     * This triggers a debounced save of settings.
     * @param field The key of the persona to update.
     * @param value The new value.
     */
    updateActiveField: async <K extends keyof PersonaDescription>(
      field: K,
      value: PersonaDescription[K],
    ): Promise<void> => {
      await usePersonaStore().updateActivePersonaField(field, value);
    },

    /**
     * Deletes a persona by its avatarId after confirmation.
     * @param avatarId The unique avatar ID of the persona to delete.
     * @returns A promise that resolves when the deletion process is complete.
     */
    delete: async (avatarId: string): Promise<void> => {
      await usePersonaStore().deletePersona(avatarId);
    },
  },

  /**
   * Functions for managing lorebooks (World Info).
   */
  worldInfo: {
    /**
     * Gets the global settings for World Info.
     * @returns A deep copy of the World Info settings object.
     */
    getSettings: (): WorldInfoSettings => {
      return JSON.parse(JSON.stringify(useWorldInfoStore().settings));
    },

    /**
     * Updates the global settings for World Info. Triggers a debounced save.
     * @param settings A partial WorldInfoSettings object with the fields to update.
     */
    updateSettings: (settings: Partial<WorldInfoSettings>): void => {
      const store = useWorldInfoStore();
      store.settings = { ...store.settings, ...settings };
    },

    /**
     * Gets a list of all lorebook names.
     * @returns An array of lorebook names.
     */
    getAllBookNames: (): string[] => {
      return useWorldInfoStore().bookNames;
    },

    /**
     * Gets the full content of a specific lorebook.
     * This will fetch the book from the server if it's not already cached.
     * @param name The name of the lorebook.
     * @returns A promise that resolves with a deep copy of the lorebook, or null if not found.
     */
    getBook: async (name: string): Promise<WorldInfoBook | null> => {
      const store = useWorldInfoStore();
      let book = store.getBookFromCache(name);
      if (!book) {
        await store.fetchBook(name);
        book = store.getBookFromCache(name);
      }
      return book ? JSON.parse(JSON.stringify(book)) : null;
    },

    /**
     * Gets the names of all currently active lorebooks.
     * @returns An array of active lorebook names.
     */
    getActiveBookNames: (): string[] => {
      return useWorldInfoStore().activeBookNames;
    },

    /**
     * Sets which lorebooks are active globally.
     * @param names An array of lorebook names to activate.
     */
    setActiveBookNames: (names: string[]): void => {
      useWorldInfoStore().activeBookNames = names;
    },

    /**
     * Updates an entry within a lorebook.
     * This triggers a debounced save.
     * @param bookName The name of the lorebook containing the entry.
     * @param entry The full entry object with updated data. Its `uid` will be used for matching.
     */
    updateEntry: (bookName: string, entry: WorldInfoEntry): void => {
      const store = useWorldInfoStore();
      const book = store.getBookFromCache(bookName);
      if (!book) {
        console.warn(`[ExtensionAPI] Cannot update entry: Book "${bookName}" not loaded.`);
        return;
      }
      const index = book.entries.findIndex((e) => e.uid === entry.uid);
      if (index > -1) {
        book.entries[index] = { ...entry };
        store.saveBookDebounced(book);
      } else {
        console.warn(`[ExtensionAPI] Cannot update entry: UID ${entry.uid} not found in book "${bookName}".`);
      }
    },
  },

  /**
   * General UI utility functions.
   */
  ui: {
    /**
     * Displays a toast notification.
     * @param message The message to display.
     * @param type The type of toast ('success', 'info', 'warning', 'error'). Defaults to 'info'.
     */
    showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      toast[type](message);
    },

    /**
     * Opens a specific side panel.
     * @param panelName The name of the panel, e.g., 'characters', 'settings'.
     */
    openPanel: (panelName: MenuType): void => {
      useUiStore().menuType = panelName;
    },

    /**
     * Closes the currently open side panel.
     */
    closePanel: (): void => {
      useUiStore().menuType = null;
    },

    /**
     * Programmatically shows a popup/dialog.
     * @param options The configuration for the popup.
     * @returns A promise that resolves with the popup result.
     */
    showPopup: (options: PopupShowOptions): Promise<{ result: number; value: any }> => {
      return usePopupStore().show(options);
    },

    /**
     * Renders a standard, pre-built Vue component into a given container.
     * @param container The HTMLElement where the component should be mounted.
     * @param componentName The name of the component to mount (e.g., 'ConnectionProfileSelector').
     * @param props An object of props to pass to the component.
     */
    mountComponent: async (
      container: HTMLElement,
      componentName: string,
      props: Record<string, any>,
    ): Promise<void> => {
      if (!container) {
        console.error(`[ExtensionAPI] mountComponent failed: container is null or undefined.`);
        return;
      }
      const componentLoader = mountableComponents[componentName];
      if (!componentLoader) {
        console.error(`[ExtensionAPI] Component "${componentName}" is not a valid mountable component.`);
        return;
      }
      try {
        const componentModule = await componentLoader();
        const component = componentModule.default;
        container.innerHTML = '';
        const componentApp = createApp(component, props);
        componentApp.use(pinia);
        componentApp.use(i18n);
        componentApp.mount(container);
      } catch (error) {
        console.error(`[ExtensionAPI] Failed to load and mount component "${componentName}":`, error);
      }
    },
  },

  /**
   * Application-level event bus for extensions. Use this to listen for events
   * and interact with data processing pipelines.
   *
   * Events prefixed with `process:` are part of a data pipeline. Listeners
   * can modify the first argument (e.g., the `payload` object) directly.
   */
  events: {
    on: eventEmitter.on.bind(eventEmitter),
    off: eventEmitter.off.bind(eventEmitter),
    emit: eventEmitter.emit.bind(eventEmitter),
  },

  /**
   * Functions for generalized, non-chat-related LLM tasks.
   */
  llm: {
    /**
     * Performs a generation task using a specified or active connection profile.
     * Ideal for background tasks like translation, summarization, etc.
     * @param messages The array of messages to send to the model.
     * @param options Configuration for the generation task.
     */
    generate: (
      messages: ApiChatMessage[],
      options: LlmGenerationOptions = {},
    ): Promise<GenerationResponse | (() => AsyncGenerator<StreamedChunk>)> => {
      const settingsStore = useSettingsStore();
      const apiStore = useApiStore();

      let source = settingsStore.settings.api.chat_completion_source;
      let model: string | undefined = apiStore.activeModel;
      let samplerSettings = { ...settingsStore.settings.api.samplers, ...(options.samplerOverrides ?? {}) };
      const profileName = options.connectionProfileName;

      if (profileName) {
        const profile = apiStore.connectionProfiles.find((p) => p.name === profileName);
        if (!profile) {
          throw new Error(`[ExtensionAPI] Connection profile "${profileName}" not found.`);
        }
        source = profile.chat_completion_source ?? source;
        model = profile.model ?? model;

        if (profile.sampler) {
          const sampler = apiStore.presets.find((p) => p.name === profile.sampler);
          if (sampler) {
            samplerSettings = { ...sampler.preset, ...(options.samplerOverrides ?? {}) };
          } else {
            throw new Error(`[ExtensionAPI] Sampler preset "${profile.sampler}" not found.`);
          }
        }
      }

      if (!model) {
        throw new Error('No model specified or found in the active/selected profile.');
      }

      const payload = buildChatCompletionPayload({
        samplerSettings,
        messages,
        model,
        source,
        providerSpecific: settingsStore.settings.api.provider_specific,
        modelList: apiStore.modelList,
      });

      return ChatCompletionService.generate(payload, options.signal);
    },
  },
};

/**
 * Creates a proxy for the extension API that scopes settings access to the specific extension.
 * @param extensionName The unique name of the extension.
 */
function createScopedApiProxy(extensionName: string): ExtensionAPI {
  const settingsStore = useSettingsStore();

  const scopedSettings = {
    get: (path: string): any => {
      const fullPath = `extensionSettings.${extensionName}.${path}`;
      const value = settingsStore.getSetting(fullPath as SettingsPath);
      if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value));
      }
      return value;
    },
    set: (path: string, value: any): void => {
      const fullPath = `extensionSettings.${extensionName}.${path}`;
      settingsStore.setSetting(fullPath as SettingsPath, value);
    },
    getGlobal: baseExtensionAPI.settings.getGlobal,
    setGlobal: baseExtensionAPI.settings.setGlobal,
    save: baseExtensionAPI.settings.save,
  };

  return {
    ...baseExtensionAPI,
    settings: scopedSettings,
  };
}

globalThis.SillyTavern = {
  vue: Vue,
  registerExtension: (extensionName: string, initCallback: (extensionName: string, api: ExtensionAPI) => void) => {
    try {
      const api = createScopedApiProxy(extensionName);
      initCallback(extensionName, api);
    } catch (error) {
      console.error(`[Extension] Failed to initialize extension "${extensionName}":`, error);
    }
  },
};

// We freeze the API object and its top-level properties to prevent extensions from modifying them.
Object.freeze(baseExtensionAPI);
Object.keys(baseExtensionAPI).forEach((key) => Object.freeze(baseExtensionAPI[key as keyof typeof baseExtensionAPI]));

// For our own project's internal use.
export { baseExtensionAPI as extensionAPI };
