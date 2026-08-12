import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import arTranslations from './locales/ar.json';
import deTranslations from './locales/de.json';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import heTranslations from './locales/he.json';
import hiTranslations from './locales/hi.json';
import inTranslations from './locales/in.json';
import itTranslations from './locales/it.json';
import jaTranslations from './locales/ja.json';
import krTranslations from './locales/kr.json';
import nlTranslations from './locales/nl.json';
import plTranslations from './locales/pl.json';
import ptTranslations from './locales/pt.json';
import ruTranslations from './locales/ru.json';
import siTranslations from './locales/si.json';
import srTranslations from './locales/sr.json';
import svTranslations from './locales/sv.json';
import thTranslations from './locales/th.json';
import trTranslations from './locales/tr.json';
import ukTranslations from './locales/uk.json';
import zhTranslations from './locales/zh.json';



i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
resources: {
  ar: { translation: arTranslations },
  de: { translation: deTranslations },
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  he: { translation: heTranslations },
  hi: { translation: hiTranslations },
  in: { translation: inTranslations },
  it: { translation: itTranslations },
  ja: { translation: jaTranslations },
  kr: { translation: krTranslations },
  nl: { translation: nlTranslations },
  pl: { translation: plTranslations },
  pt: { translation: ptTranslations },
  ru: { translation: ruTranslations },
  si: { translation: siTranslations },
  sr: { translation: srTranslations },
  sv: { translation: svTranslations },
  th: { translation: thTranslations },
  tr: { translation: trTranslations },
  uk: { translation: ukTranslations },
  zh: { translation: zhTranslations }
},
    lng: 'en',        // Forces the application to start in English
    fallbackLng: 'en', // The language to use if a translation is missing
    interpolation: { 
      escapeValue: false 
    }
  });

export default i18n;