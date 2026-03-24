import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { BookOpen, UserPlus, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { t } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) { navigate('/'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) { toast.error(t('register.consentRequired')); return; }
    if (password !== confirmPassword) { toast.error(t('register.passwordMismatch')); return; }
    if (password.length < 8) { toast.error(t('register.passwordTooShort')); return; }

    setIsLoading(true);
    try {
      await register(name, email, password);
      toast.success(t('register.success'));
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('register.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600"><BookOpen className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
          </Link>
          <LangSwitcher />
        </div>

        <Card className="card-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
            <CardDescription>{t('register.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('register.name')}</Label>
                <Input id="name" type="text" placeholder={t('register.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required data-testid="register-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('register.email')}</Label>
                <Input id="email" type="email" placeholder={t('register.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="register-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('register.password')}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="register-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
                <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required data-testid="register-confirm-password" />
              </div>

              {/* GDPR Consent */}
              <div className="flex items-start space-x-2" data-testid="consent-checkbox">
                <Checkbox id="consent" checked={consent} onCheckedChange={setConsent} className="mt-1" />
                <label htmlFor="consent" className="text-sm text-gray-600 leading-snug cursor-pointer">
                  {t('register.consent')}{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline" target="_blank">{t('register.consentPrivacy')}</Link>
                  {' '}{t('register.consentAnd')}{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline" target="_blank">{t('register.consentTerms')}</Link>
                </label>
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={isLoading} data-testid="register-submit">
                {isLoading ? t('register.submitting') : <><UserPlus className="w-4 h-4 mr-2" />{t('register.submit')}</>}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">{t('register.login')}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
