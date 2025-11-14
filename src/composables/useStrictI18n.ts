import { useI18n as useOriginalI18n, type NamedValue, type TranslateOptions } from 'vue-i18n';
import type { I18nKey } from '../types/i18n';

export interface StrictT {
  (key: I18nKey): string;
  (key: I18nKey, plural: number): string;
  (key: I18nKey, defaultMsg: string): string;
  (key: I18nKey, list: unknown[]): string;
  (key: I18nKey, named: NamedValue): string;
  (key: I18nKey, named: NamedValue, options: TranslateOptions): string;
  (key: I18nKey, list: unknown[], options: TranslateOptions): string;
  (key: I18nKey, plural: number, options: TranslateOptions): string;
}

/**
 * A wrapper around `vue-i18n/useI18n` that provides a strictly-typed `t` function,
 * ensuring that only valid, auto-generated keys are used.
 */
export function useStrictI18n() {
  const i18n = useOriginalI18n();

  const strictT = i18n.t as StrictT;

  return {
    ...i18n,
    t: strictT,
  };
}
