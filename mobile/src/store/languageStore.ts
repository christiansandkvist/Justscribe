import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings, Language } from '../constants/i18n';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof strings.en;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang, t: strings[lang] }),
      t: strings.en,
    }),
    {
      name: 'scribetogo-language',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) state.t = strings[state.language];
      },
    }
  )
);
