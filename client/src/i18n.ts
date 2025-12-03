// File Location: client/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'am', 'om'], // Explicitly list supported languages
    debug: true, // Keep true for now to debug issues
    
    defaultNS: 'translation', // Critical: Tells i18next to look in translation.json by default
    ns: ['translation'],
    
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    
    backend: {
      // Ensure this path matches your public folder structure:
      // public/locales/en/translation.json
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: true, // Enable suspense for loading translations
    }
  });

export default i18n;