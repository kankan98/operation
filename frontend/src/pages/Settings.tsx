import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Plug } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';

type Section = 'general' | 'account' | 'integrations' | 'notifications' | 'billing' | 'api' | 'team';
const SECTIONS: Section[] = ['general', 'account', 'integrations', 'notifications', 'billing', 'api', 'team'];

const INTEGRATIONS = [
  { name: 'Amazon', color: '#FF9900', connected: true },
  { name: 'Shopify', color: '#95BF47', connected: true },
  { name: 'eBay', color: '#E53238', connected: false },
  { name: 'TikTok Shop', color: '#000000', connected: false },
  { name: 'Google Ads', color: '#4285F4', connected: true },
  { name: 'Meta Ads', color: '#0866FF', connected: false },
];

const LANG_LABELS: Record<AppLanguage, string> = { en: 'English', zh: '简体中文' };

export function Settings() {
  const { t, i18n } = useTranslation('settings');
  const [active, setActive] = useState<Section>('general');
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const currentLang = (i18n.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en') as AppLanguage;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        {/* Category nav */}
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {SECTIONS.map((section) => (
            <button
              key={section}
              onClick={() => setActive(section)}
              className={cn(
                'rounded-[10px] px-3 py-2 text-left text-sm font-medium transition-colors duration-150',
                active === section
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-fg-muted hover:bg-subtle hover:text-fg',
              )}
            >
              {t(`nav.${section}`)}
            </button>
          ))}
        </nav>

        {/* Panels */}
        <div className="space-y-6">
          {active === 'general' && (
            <>
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>{t('appearance')}</CardTitle>
                    <CardDescription>{t('themeDesc')}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-fg">{t('theme')}</span>
                    <div className="flex items-center gap-1 rounded-button bg-subtle p-1">
                      <ThemeOption icon={Sun} label={t('light')} active={theme === 'light'} onClick={() => setTheme('light')} />
                      <ThemeOption icon={Moon} label={t('dark')} active={theme === 'dark'} onClick={() => setTheme('dark')} />
                    </div>
                  </div>
                  {/* Language */}
                  <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-6">
                    <div>
                      <p className="text-sm font-medium text-fg">{t('language')}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">{t('languageDesc')}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-button bg-subtle p-1">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => i18n.changeLanguage(lang)}
                          className={cn(
                            'rounded-[9px] px-3 py-1.5 text-sm font-medium transition-colors',
                            currentLang === lang ? 'bg-surface text-fg shadow-e1' : 'text-fg-muted hover:text-fg',
                          )}
                        >
                          {LANG_LABELS[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SystemInfoCard />
              <AboutCard />
            </>
          )}

          {active === 'integrations' && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('integrations')}</CardTitle>
                  <CardDescription>{t('integrationsDesc')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {INTEGRATIONS.map((it) => (
                    <div
                      key={it.name}
                      className="flex items-center gap-3 rounded-input border border-border-subtle p-4"
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] text-sm font-bold text-white"
                        style={{ backgroundColor: it.color }}
                      >
                        {it.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{it.name}</p>
                        {it.connected ? (
                          <Badge variant="success" dot className="mt-0.5">
                            {t('connected')}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="mt-0.5">
                            {t('notConnected')}
                          </Badge>
                        )}
                      </div>
                      {!it.connected && (
                        <Button size="sm" variant="secondary">
                          {t('connect')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {active !== 'general' && active !== 'integrations' && (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-subtle">
                  <Plug className="h-7 w-7 text-fg-subtle" />
                </div>
                <p className="text-base font-semibold text-fg">{t(`nav.${active}`)}</p>
                <p className="mt-1 text-sm text-fg-muted">{t('common:loading', { defaultValue: '' })}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sun;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-surface text-fg shadow-e1' : 'text-fg-muted hover:text-fg',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function SystemInfoCard() {
  const { t } = useTranslation('settings');
  const rows = [
    { label: t('backendStatus'), value: <Badge variant="success" dot>{t('connected')}</Badge> },
    { label: t('apiVersion'), value: <span className="text-fg tabular-nums">v1.0.0</span> },
    { label: t('frontendVersion'), value: <span className="text-fg tabular-nums">v1.0.0</span> },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('systemInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border-subtle">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0">
            <span className="text-fg-muted">{row.label}</span>
            {row.value}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AboutCard() {
  const { t } = useTranslation('settings');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('about')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-fg-muted">{t('aboutText')}</p>
      </CardContent>
    </Card>
  );
}
