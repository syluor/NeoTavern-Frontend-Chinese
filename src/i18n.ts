import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';
import type { MessageSchema } from './types/i18n';

function getInitialLocale() {
  const savedLocale = localStorage.getItem('user-locale');
  // @ts-ignore
  if (savedLocale && Object.keys(messages).includes(savedLocale)) {
    return savedLocale;
  }

  const browserLang = navigator.language.split('-')[0];
  // @ts-ignore
  return Object.keys(messages).includes(browserLang) ? browserLang : 'en';
}

const i18n = createI18n<[MessageSchema], 'en'>({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  // @ts-ignore
  messages,
});

export default i18n;
