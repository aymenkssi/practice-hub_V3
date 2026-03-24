import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Shield } from 'lucide-react';

export function CookieConsent() {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setShow(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-lg" data-testid="cookie-consent">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 hidden sm:block" />
        <p className="text-sm text-gray-600 flex-1 text-center sm:text-left">
          {t('cookie.message')}{' '}
          <Link to="/privacy" className="text-blue-600 hover:underline font-medium">
            {t('cookie.privacyLink')}
          </Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDecline} data-testid="cookie-decline">
            {t('cookie.decline')}
          </Button>
          <Button size="sm" onClick={handleAccept} data-testid="cookie-accept">
            {t('cookie.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
