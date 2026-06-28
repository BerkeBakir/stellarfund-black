'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MESSAGES, type Locale, type MessageKey } from './messages';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'stellarfund.locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' &&
      localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (saved === 'en' || saved === 'tr') {
      setLocaleState(saved);
    } else if (typeof navigator !== 'undefined' && navigator.language.startsWith('tr')) {
      setLocaleState('tr');
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey) => MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key,
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
