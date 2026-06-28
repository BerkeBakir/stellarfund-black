'use client';
import { useI18n } from '@/i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-white/10 text-xs">
      {(['en', 'tr'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2 py-1 uppercase ${
            locale === l ? 'bg-white/15 font-semibold' : 'opacity-60 hover:opacity-100'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
