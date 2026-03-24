import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { Footer } from '../components/Footer';
import { 
  BookOpen, Award, Users, CheckCircle, ArrowRight, Shield, LogIn, UserPlus, LayoutDashboard
} from 'lucide-react';
import { Button } from '../components/ui/button';

export default function HomePage() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col" data-testid="home-page">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/exams" className="nav-link" data-testid="nav-exams">{t('nav.exams')}</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/results" className="nav-link" data-testid="nav-results">{t('nav.myResults')}</Link>
                  <Link to="/profile" className="nav-link" data-testid="nav-my-exams">{t('nav.myExams')}</Link>
                  {isAdmin && (
                    <Link to="/admin" className="nav-link" data-testid="nav-admin">
                      <LayoutDashboard className="w-4 h-4 inline mr-1" />{t('nav.admin')}
                    </Link>
                  )}
                  <Link to="/profile" data-testid="nav-profile">
                    <Button variant="outline" size="sm">{user?.name}</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" data-testid="nav-login">
                    <Button variant="ghost" size="sm"><LogIn className="w-4 h-4 mr-2" />{t('nav.login')}</Button>
                  </Link>
                  <Link to="/register" data-testid="nav-register">
                    <Button size="sm" className="gradient-primary"><UserPlus className="w-4 h-4 mr-2" />{t('nav.register')}</Button>
                  </Link>
                </>
              )}
              <LangSwitcher />
            </nav>
          </div>
        </div>
      </header>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Award className="w-4 h-4" />{t('home.badge')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t('home.title')} <span className="text-blue-600">{t('home.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">{t('home.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gradient-primary h-14 px-8 text-lg" onClick={() => navigate('/exams')} data-testid="cta-explore">
              {t('home.ctaExplore')}<ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {!isAuthenticated && (
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg" onClick={() => navigate('/register')} data-testid="cta-register">
                {t('home.ctaRegister')}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.whyTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="stat-card text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature1Title')}</h3>
              <p className="text-gray-600">{t('home.feature1Desc')}</p>
            </div>
            <div className="stat-card text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature2Title')}</h3>
              <p className="text-gray-600">{t('home.feature2Desc')}</p>
            </div>
            <div className="stat-card text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature3Title')}</h3>
              <p className="text-gray-600">{t('home.feature3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">{t('home.ctaFreeTitle')}</h2>
          <p className="text-xl text-gray-600 mb-8">{t('home.ctaFreeDesc')}</p>
          <Button size="lg" className="gradient-primary h-14 px-8 text-lg" onClick={() => navigate(isAuthenticated ? '/exams' : '/register')}>
            {isAuthenticated ? t('home.ctaSeeExams') : t('home.ctaCreateAccount')}<ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
