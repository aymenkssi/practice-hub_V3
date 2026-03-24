import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="py-8 px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>{t('home.copyright')}</p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="hover:text-gray-800 transition-colors" data-testid="footer-privacy">
            {t('nav.privacy')}
          </Link>
          <Link to="/terms" className="hover:text-gray-800 transition-colors" data-testid="footer-terms">
            {t('nav.terms')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
