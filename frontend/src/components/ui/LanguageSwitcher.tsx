import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';

const LANG_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  zh: '简体中文',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = (i18n.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en') as AppLanguage;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const change = (lang: AppLanguage) => {
    i18n.changeLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        className="flex h-9 items-center gap-1.5 rounded-button px-2.5 text-sm font-medium text-fg-muted transition-colors duration-150 hover:bg-subtle hover:text-fg"
      >
        <Globe className="h-4 w-4" />
        <span>{current === 'zh' ? '中文' : 'EN'}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 origin-top-right animate-scale-in overflow-hidden rounded-card border border-border bg-surface p-1 shadow-e3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => change(lang)}
              className={cn(
                'flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-sm transition-colors duration-150 hover:bg-subtle',
                current === lang ? 'font-semibold text-primary-600' : 'text-fg',
              )}
            >
              {LANG_LABELS[lang]}
              {current === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
