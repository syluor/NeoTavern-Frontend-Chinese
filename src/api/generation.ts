import { ReasoningEffort } from '../constants';
import type { ChatCompletionPayload, ChatCompletionSource, GenerationResponse, StreamedChunk } from '../types';
import { chat_completion_sources } from '../types';
import type { BuildChatCompletionPayloadOptions } from '../types/generation';
import type { SamplerSettings } from '../types/settings';
import { getRequestHeaders } from '../utils/client';
import {
  MODEL_INJECTIONS,
  PARAMETER_DEFINITIONS,
  PROVIDER_INJECTIONS,
  type ParamHandling,
} from './provider-definitions';

const REASONING_EFFORT_SOURCES: ChatCompletionSource[] = [
  chat_completion_sources.OPENAI,
  chat_completion_sources.AZURE_OPENAI,
  chat_completion_sources.CUSTOM,
  chat_completion_sources.XAI,
  chat_completion_sources.AIMLAPI,
  chat_completion_sources.OPENROUTER,
  chat_completion_sources.POLLINATIONS,
  chat_completion_sources.PERPLEXITY,
  chat_completion_sources.COMETAPI,
  chat_completion_sources.ELECTRONHUB,
];

export function buildChatCompletionPayload(options: BuildChatCompletionPayloadOptions): ChatCompletionPayload {
  const { samplerSettings, messages, model, source } = options;

  const payload: ChatCompletionPayload = {
    messages,
    model,
    chat_completion_source: source,
    include_reasoning: !!samplerSettings.show_thoughts,
  };

  // 1. Map Parameters (Per-Param Logic)
  for (const key in samplerSettings) {
    const samplerKey = key as keyof SamplerSettings;

    // Explicitly skip internal/non-payload settings
    if (
      samplerKey === 'prompts' ||
      samplerKey === 'prompt_order' ||
      samplerKey === 'providers' ||
      samplerKey === 'max_context_unlocked' ||
      samplerKey === 'reasoning_effort' // Handled separately
    ) {
      continue;
    }

    const config = PARAMETER_DEFINITIONS[samplerKey];

    // If a parameter has no definition, we default to "pass-through"
    // UNLESS it is one of the strictly gated parameters defined in provider-definitions.ts with defaults: null.
    // However, if the key is not in PARAMETER_DEFINITIONS at all, config is undefined.
    // We treat undefined config as "safe to pass" (backward compatibility),
    // but the critical ones (min_p, etc) ARE defined in PARAMETER_DEFINITIONS now.

    let rule: ParamHandling | null | undefined = config?.defaults;

    // Apply provider specific overrides
    if (config?.providers && source in config.providers) {
      const providerRule = config.providers[source];
      if (providerRule === null) {
        rule = null;
      } else if (providerRule) {
        rule = { ...rule, ...providerRule };
      }
    }

    // Apply model specific overrides
    if (config?.modelRules) {
      for (const modelRule of config.modelRules) {
        if (modelRule.pattern.test(model)) {
          if (modelRule.rule === null) {
            rule = null;
          } else if (modelRule.rule) {
            rule = { ...rule, ...modelRule.rule };
          }
        }
      }
    }

    // If the rule is explicitly null (either via defaults or override), skip this parameter.
    if (rule === null) continue;

    let value = samplerSettings[samplerKey];

    // Transform / Validation
    if (rule?.transform) {
      value = rule.transform(value, options);
    }

    // Clamping
    if (typeof value === 'number' && rule) {
      if (rule.min !== undefined) value = Math.max(value, rule.min);
      if (rule.max !== undefined) value = Math.min(value, rule.max);
    }

    // Assignment (ignoring undefined)
    if (value !== undefined) {
      const payloadKey = (rule?.remoteKey || samplerKey) as keyof ChatCompletionPayload;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload as any)[payloadKey] = value;
    }
  }

  // 2. Apply Provider Specific Injections (auth tokens, strict deletions, etc.)
  const providerInject = PROVIDER_INJECTIONS[source];
  if (providerInject) {
    providerInject(payload, options);
  }

  // 3. Apply Model Specific Injections (O1 role swaps, GPT-5 cleanups)
  for (const rule of MODEL_INJECTIONS) {
    if (rule.pattern.test(model)) {
      rule.inject(payload, options);
    }
  }

  // 4. Apply Reasoning Effort Logic (Shared logic)
  applyReasoningEffort(payload, options);

  // 5. TODO: ToolManager integration
  // if (!canMultiSwipe && ToolManager.canPerformToolCalls(type)) { ... }

  return payload;
}

function applyReasoningEffort(payload: ChatCompletionPayload, options: BuildChatCompletionPayloadOptions) {
  const { samplerSettings, source, model, modelList } = options;

  if (!samplerSettings.reasoning_effort) return;
  if (!REASONING_EFFORT_SOURCES.includes(source)) return;

  // Azure Specific Constraint: Reasoning effort not supported on older GPT-3/4 models
  if (source === chat_completion_sources.AZURE_OPENAI && /^gpt-[34]/.test(model)) {
    return;
  }
  // XAI Constraint: only grok-3-mini supports reasoning effort currently
  if (source === chat_completion_sources.XAI && !model.includes('grok-3-mini')) {
    return;
  }

  let reasoningEffort: ReasoningEffort | string | undefined = samplerSettings.reasoning_effort;

  switch (samplerSettings.reasoning_effort) {
    case ReasoningEffort.AUTO:
      reasoningEffort = undefined;
      break;
    case ReasoningEffort.MIN:
      // Special case for GPT-5 on OpenAI/Azure
      if (
        (source === chat_completion_sources.OPENAI || source === chat_completion_sources.AZURE_OPENAI) &&
        /^gpt-5/.test(model)
      ) {
        reasoningEffort = ReasoningEffort.MIN;
      } else {
        reasoningEffort = ReasoningEffort.LOW;
      }
      break;
    case ReasoningEffort.MAX:
      reasoningEffort = ReasoningEffort.HIGH;
      break;
    default:
      reasoningEffort = samplerSettings.reasoning_effort;
  }

  // ElectronHub specific validation
  if (source === chat_completion_sources.ELECTRONHUB && Array.isArray(modelList) && reasoningEffort) {
    const currentModel = modelList.find((m) => m.id === model);
    const supportedEfforts = currentModel?.metadata?.supported_reasoning_efforts;
    if (Array.isArray(supportedEfforts) && !supportedEfforts.includes(reasoningEffort as string)) {
      reasoningEffort = undefined;
    }
  }

  if (reasoningEffort) {
    payload.reasoning_effort = reasoningEffort;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleApiError(data: any): void {
  if (data?.error) {
    const errorMessage = data.error.message || data.error.type || 'An unknown API error occurred.';
    if (data.error.code === 'insufficient_quota') {
      throw new Error('You have exceeded your current quota. Please check your plan and billing details.');
    }
    throw new Error(errorMessage);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessage(data: any, source: ChatCompletionSource): string {
  if (typeof data === 'string') {
    return data;
  }

  switch (source) {
    case chat_completion_sources.CLAUDE:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data?.content?.find((p: any) => p.type === 'text')?.text ?? '';
    case chat_completion_sources.OPENAI:
    case chat_completion_sources.OPENROUTER:
    // Fallback for most OpenAI-compatible APIs
    default:
      return (
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        data?.results?.[0]?.output?.text ??
        data?.content?.[0]?.text ??
        ''
      );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractReasoning(data: any, source: ChatCompletionSource): string | undefined {
  switch (source) {
    case chat_completion_sources.CLAUDE:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data?.content?.find((p: any) => p.type === 'thinking')?.thinking;
    case chat_completion_sources.MAKERSUITE:
    case chat_completion_sources.VERTEXAI:
      return (
        data?.responseContent?.parts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?.filter((p: any) => p.thought)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?.map((p: any) => p.text)
          ?.join('\n\n') ?? ''
      );
    case chat_completion_sources.MISTRALAI:
      return (
        data?.choices?.[0]?.message?.content?.[0]?.thinking
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?.map((p: any) => p.text)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?.filter((x: any) => x)
          ?.join('\n\n') ?? ''
      );
    case chat_completion_sources.OPENROUTER:
    case chat_completion_sources.DEEPSEEK:
    case chat_completion_sources.XAI:
    case chat_completion_sources.AIMLAPI:
    case chat_completion_sources.POLLINATIONS:
    case chat_completion_sources.MOONSHOT:
    case chat_completion_sources.COMETAPI:
    case chat_completion_sources.ELECTRONHUB:
    case chat_completion_sources.NANOGPT:
    case chat_completion_sources.ZAI:
    case chat_completion_sources.CUSTOM:
      return data?.choices?.[0]?.message?.reasoning_content ?? data?.choices?.[0]?.message?.reasoning;
    default:
      return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStreamingReply(data: any, source: ChatCompletionSource): { delta: string; reasoning?: string } {
  switch (source) {
    case chat_completion_sources.CLAUDE:
      return {
        delta: data?.delta?.text || '',
        reasoning: data?.delta?.thinking || '',
      };
    case chat_completion_sources.MAKERSUITE:
    case chat_completion_sources.VERTEXAI:
      return {
        delta:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data?.candidates?.[0]?.content?.parts?.filter((x: any) => !x.thought)?.map((x: any) => x.text)?.[0] || '',
        reasoning:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data?.candidates?.[0]?.content?.parts?.filter((x: any) => x.thought)?.map((x: any) => x.text)?.[0] || '',
      };
    case chat_completion_sources.MISTRALAI:
      return {
        delta:
          data.choices?.[0]?.delta?.content
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ?.map((x: any) => x.text)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((x: any) => x)
            .join('') || '',
        reasoning:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.choices?.filter((x: any) => x?.delta?.content?.[0]?.thinking)?.[0]?.delta?.content?.[0]?.thinking?.[0]
            ?.text || '',
      };
    case chat_completion_sources.OPENROUTER:
      return {
        delta:
          data.choices?.[0]?.delta?.content ?? data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reasoning: data.choices?.filter((x: any) => x?.delta?.reasoning)?.[0]?.delta?.reasoning || '',
      };
    case chat_completion_sources.DEEPSEEK:
    case chat_completion_sources.XAI:
    case chat_completion_sources.CUSTOM:
    case chat_completion_sources.POLLINATIONS:
    case chat_completion_sources.AIMLAPI:
    case chat_completion_sources.MOONSHOT:
    case chat_completion_sources.COMETAPI:
    case chat_completion_sources.ELECTRONHUB:
    case chat_completion_sources.NANOGPT:
    case chat_completion_sources.ZAI:
      return {
        delta:
          data.choices?.[0]?.delta?.content ?? data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '',
        reasoning:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.choices?.filter((x: any) => x?.delta?.reasoning_content)?.[0]?.delta?.reasoning_content ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.choices?.filter((x: any) => x?.delta?.reasoning)?.[0]?.delta?.reasoning ??
          '',
      };
    // Fallback for OpenAI and compatible APIs
    case chat_completion_sources.OPENAI:
    default:
      return {
        delta:
          data.choices?.[0]?.delta?.content ?? data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '',
      };
  }
}

export class ChatCompletionService {
  static async generate(
    payload: ChatCompletionPayload,
    signal?: AbortSignal,
  ): Promise<GenerationResponse | (() => AsyncGenerator<StreamedChunk>)> {
    const commonOptions = {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(payload),
      cache: 'no-cache',
      signal,
    } satisfies RequestInit;

    if (!payload.stream) {
      const response = await fetch('/api/backends/chat-completions/generate', commonOptions);
      const responseData = await response.json().catch(() => ({ error: 'Failed to parse JSON response' }));

      if (!response.ok) {
        handleApiError(responseData);
        throw new Error(`Request failed with status ${response.status}`);
      }
      handleApiError(responseData);

      const source = payload.chat_completion_source as ChatCompletionSource;
      const messageContent = extractMessage(responseData, source);
      const reasoning = extractReasoning(responseData, source);

      return {
        content: messageContent,
        reasoning: reasoning,
      };
    }

    const response = await fetch('/api/backends/chat-completions/generate', commonOptions);

    if (!response.ok || !response.body) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorText = await response.text();
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        // TODO: Not a JSON error, use the status text
      }
      throw new Error(errorMessage);
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

    return async function* streamData(): AsyncGenerator<StreamedChunk> {
      let reasoning = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last, possibly incomplete, line

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const data = line.trim().substring(6);
              if (data === '[DONE]') {
                return;
              }
              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error.message || 'Unknown stream error');
                }

                const source = payload.chat_completion_source as ChatCompletionSource;
                const chunk = getStreamingReply(parsed, source);

                const hasNewReasoning = chunk.reasoning && chunk.reasoning.length > 0;
                const hasNewDelta = chunk.delta && chunk.delta.length > 0;

                if (hasNewReasoning) {
                  reasoning += chunk.reasoning;
                }

                if (hasNewDelta || hasNewReasoning) {
                  yield { delta: chunk.delta || '', reasoning: reasoning };
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', data, e);
              }
            }
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.debug('Stream aborted by user.');
        } else {
          throw error;
        }
      }
    };
  }
}
