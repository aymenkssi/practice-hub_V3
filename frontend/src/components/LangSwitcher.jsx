import { useLang } from '../context/LanguageContext';
import { Button } from './ui/button';

export function LangSwitcher() {
  const { lang, switchLang } = useLang();

  return (
    <div className="flex items-center gap-1 border rounded-lg overflow-hidden" data-testid="lang-switcher">
      <Button
        variant={lang === 'fr' ? 'default' : 'ghost'}
        size="sm"
        className={`h-7 px-2 text-xs rounded-none ${lang === 'fr' ? '' : 'text-gray-500'}`}
        onClick={() => switchLang('fr')}
        data-testid="lang-fr"
      >
        FR
      </Button>
      <Button
        variant={lang === 'en' ? 'default' : 'ghost'}
        size="sm"
        className={`h-7 px-2 text-xs rounded-none ${lang === 'en' ? '' : 'text-gray-500'}`}
        onClick={() => switchLang('en')}
        data-testid="lang-en"
      >
        EN
      </Button>
    </div>
  );
}
