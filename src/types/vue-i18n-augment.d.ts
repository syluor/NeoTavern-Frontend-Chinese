import 'vue-i18n';
import type { MessageSchema } from './i18n';

declare module 'vue-i18n' {
  /**
   * Augment the `DefineLocaleMessage` interface to provide
   * global type-safety for translation keys.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}
