import type { AiConfigSection } from './types';

export const aiConfigDefinition: AiConfigSection[] = [
  {
    id: 'presets',
    items: [
      {
        widget: 'preset-manager',
        id: 'api.selected_sampler',
        apiId: 'openai',
        label: 'aiConfig.presets.chatCompletion.label',
        conditions: { api: 'openai' },
      },
      // TODO: Add preset managers for other APIs like 'kobold', 'novel', etc.
    ],
  },
  {
    id: 'prompt-management',
    items: [
      {
        widget: 'prompt-manager-button',
        label: 'aiConfig.promptManager.label',
        description: 'aiConfig.promptManager.description',
      },
    ],
  },
  {
    id: 'common-settings',
    conditions: { api: 'openai' },
    items: [
      {
        id: 'api.samplers.max_context',
        widget: 'slider',
        label: 'aiConfig.contextSize.label',
        min: 512,
        max: 4095, // Default for older models, will be updated from API
        step: 1,
        maxUnlockedId: 'api.samplers.max_context_unlocked',
        unlockLabel: 'aiConfig.contextSize.unlocked',
        unlockTooltip: 'aiConfig.contextSize.unlockedTooltip',
      },
      {
        id: 'api.samplers.max_tokens',
        widget: 'number-input',
        label: 'aiConfig.maxResponseLength.label',
        min: 1,
        max: 128000,
        step: 1,
      },
      { widget: 'hr' },
      {
        id: 'api.samplers.stream',
        widget: 'checkbox',
        label: 'aiConfig.streaming.label',
        description: 'aiConfig.streaming.description',
      },
    ],
  },
  {
    id: 'openai-sliders',
    conditions: { api: 'openai' },
    items: [
      {
        id: 'api.samplers.temperature',
        widget: 'slider',
        label: 'aiConfig.temperature.label',
        min: 0,
        max: 2,
        step: 0.01,
      },
      {
        id: 'api.samplers.frequency_penalty',
        widget: 'slider',
        label: 'aiConfig.freqPenalty.label',
        min: -2,
        max: 2,
        step: 0.01,
      },
      {
        id: 'api.samplers.presence_penalty',
        widget: 'slider',
        label: 'aiConfig.presPenalty.label',
        min: -2,
        max: 2,
        step: 0.01,
      },
      {
        id: 'api.samplers.top_k',
        widget: 'slider',
        label: 'aiConfig.topK.label',
        min: 0,
        max: 500,
        step: 1,
      },
      {
        id: 'api.samplers.top_p',
        widget: 'slider',
        label: 'aiConfig.topP.label',
        min: 0,
        max: 1,
        step: 0.01,
      },
      // TODO: Add other sliders like repetition_penalty, min_p, top_a based on source
    ],
  },
  // TODO: Add Utility Prompts section
];
