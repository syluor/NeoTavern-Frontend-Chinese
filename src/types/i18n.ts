import type { MessageSchema } from './i18n.d'; // The auto-generated interface
import type { Path } from './utils';

/**
 * Represents a type-safe, dot-notation path to any string in the i18n message schema.
 * This provides autocomplete and compile-time checking for translation keys.
 */
export type I18nKey = Path<MessageSchema>;
export { type MessageSchema };
