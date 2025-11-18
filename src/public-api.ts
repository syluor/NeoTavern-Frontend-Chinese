export type {
  Character,
  ChatMessage,
  Persona,
  WorldInfoBook,
  WorldInfoEntry,
  Settings,
  SettingsPath,
  ApiChatMessage,
  ChatCompletionPayload,
  GenerationResponse,
  StreamedChunk,
  ExtensionAPI,
} from './types';
export * from './constants';
export { type PromptBuilder } from './utils/prompt-builder';
export { type WorldInfoProcessor } from './utils/world-info-processor';

import type { ExtensionAPI } from './types';
import type * as Vue from 'vue';

declare global {
  var SillyTavern: {
    /**
     * The instance of Vue being used by the main application.
     * Extensions can use this to create their own components.
     */
    vue: typeof Vue;

    /**
     * The entry point for an extension to register itself with SillyTavern.
     * @param extensionName A unique name for your extension.
     * @param initCallback The function that will be called to initialize your extension.
     */
    registerExtension: (
      extensionName: string,
      initCallback: (extensionName: string, api: ExtensionAPI) => void,
    ) => void;
  };
}
