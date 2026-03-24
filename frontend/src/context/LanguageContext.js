import { createContext, useContext, useState, useCallback } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr');

  const switchLang = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback((path) => {
    const keys = path.split('.');
    let obj = translations;
    for (const k of keys) {
      obj = obj?.[k];
      if (!obj) return path;
    }
    return obj[lang] || obj['fr'] || path;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
