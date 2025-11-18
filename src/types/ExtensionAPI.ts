import type { ValueForPath } from './utils';
import type { PromptBuilder } from '../utils/prompt-builder';
import type { WorldInfoProcessor } from '../utils/world-info-processor';
import type { EventPriority } from '../constants';
import type { ChatMessage } from './chat';
import type { SamplerSettings, Settings, SettingsPath } from './settings';
import type { ApiChatMessage, ChatCompletionPayload, GenerationResponse, StreamedChunk } from './generation';
import type { Character } from './character';
import type { Persona, PersonaDescription } from './persona';
import type { WorldInfoBook, WorldInfoEntry, WorldInfoSettings } from './world-info';
import type { MenuType } from './common';
import type { ExtensionEventMap } from './events';
import type { PopupShowOptions } from './popup';

export interface LlmGenerationOptions {
  connectionProfileName?: string;
  samplerOverrides?: Partial<SamplerSettings>;
  signal?: AbortSignal;
}

export interface ExtensionAPI {
  chat: {
    sendMessage: (messageText: string, options?: { triggerGeneration?: boolean }) => Promise<void>;
    getHistory: () => ChatMessage[];
    getLastMessage: () => ChatMessage | null;
    insertMessage: (message: Omit<ChatMessage, 'send_date'> & { send_date?: string }, index?: number) => void;
    updateMessage: (index: number, newContent: string, newReasoning?: string) => Promise<void>;
    updateMessageObject: (index: number, updates: Partial<ChatMessage>) => Promise<void>;
    deleteMessage: (index: number) => Promise<void>;
    regenerateResponse: () => Promise<void>;
    continueResponse: () => Promise<void>;
    clear: () => Promise<void>;
    abortGeneration: () => void;
    generate: (
      payload: ChatCompletionPayload,
      signal?: AbortSignal,
    ) => Promise<GenerationResponse | (() => AsyncGenerator<StreamedChunk>)>;
    buildPayload: (messages: ApiChatMessage[], samplerOverrides?: Partial<SamplerSettings>) => ChatCompletionPayload;
    PromptBuilder: typeof PromptBuilder;
    WorldInfoProcessor: typeof WorldInfoProcessor;
  };
  settings: {
    get: (path: string) => any;
    getGlobal: <P extends SettingsPath>(path: P) => ValueForPath<Settings, P>;
    set: (path: string, value: any) => void;
    setGlobal: <P extends SettingsPath>(path: P, value: ValueForPath<Settings, P>) => void;
    save: () => void;
  };
  character: {
    getActive: () => Character | null;
    getAll: () => Character[];
    setActive: (avatar: string) => Promise<void>;
    updateActive: (data: Partial<Character>) => void;
  };
  persona: {
    getActive: () => Persona | null;
    getAll: () => Persona[];
    setActive: (avatarId: string) => void;
    updateActiveField: <K extends keyof PersonaDescription>(field: K, value: PersonaDescription[K]) => Promise<void>;
    delete: (avatarId: string) => Promise<void>;
  };
  worldInfo: {
    getSettings: () => WorldInfoSettings;
    updateSettings: (settings: Partial<WorldInfoSettings>) => void;
    getAllBookNames: () => string[];
    getBook: (name: string) => Promise<WorldInfoBook | null>;
    getActiveBookNames: () => string[];
    setActiveBookNames: (names: string[]) => void;
    updateEntry: (bookName: string, entry: WorldInfoEntry) => void;
  };
  ui: {
    showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
    openPanel: (panelName: MenuType) => void;
    closePanel: () => void;
    showPopup: (options: PopupShowOptions) => Promise<{ result: number; value: any }>;
    mountComponent: (container: HTMLElement, componentName: string, props: Record<string, any>) => Promise<void>;
  };
  events: {
    on: <E extends keyof ExtensionEventMap>(
      eventName: E,
      listener: (...args: ExtensionEventMap[E]) => Promise<void> | void,
      priority?: number | EventPriority,
    ) => () => void;
    off: <E extends keyof ExtensionEventMap>(
      eventName: E,
      listener: (...args: ExtensionEventMap[E]) => Promise<void> | void,
    ) => void;
    emit: <E extends keyof ExtensionEventMap>(eventName: E, ...args: ExtensionEventMap[E]) => Promise<void>;
  };
  llm: {
    generate: (
      messages: ApiChatMessage[],
      options?: LlmGenerationOptions,
    ) => Promise<GenerationResponse | (() => AsyncGenerator<StreamedChunk>)>;
  };
}
