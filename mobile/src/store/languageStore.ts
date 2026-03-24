import { create } from 'zustand';
import { strings, Language } from '../constants/i18n';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof strings.en;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'en',
  t: strings.en,
  setLanguage: (lang: Language) => {
    set({ language: lang, t: strings[lang] });
  },
}));
