import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';

function getInitialLocale() {
  const savedLocale = localStorage.getItem('user-locale');
  if (savedLocale && Object.keys(messages).includes(savedLocale)) {
    return savedLocale;
  }

  const browserLang = navigator.language.split('-')[0];
  return Object.keys(messages).includes(browserLang) ? browserLang : 'en';
}

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages,
});

export default i18n;
