import { env } from '@/shared/config/env';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';

const supportedLocales = ['ru', 'en'] as const;
export type AppLocale = (typeof supportedLocales)[number];

function resolveInitialLocale(): AppLocale {
  const deviceCode = Localization.getLocales()[0]?.languageCode ?? env.defaultLocale;

  if (supportedLocales.includes(deviceCode as AppLocale)) {
    return deviceCode as AppLocale;
  }

  return env.defaultLocale;
}

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: resolveInitialLocale(),
  fallbackLng: env.defaultLocale,
  supportedLngs: [...supportedLocales],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
