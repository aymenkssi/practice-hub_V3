import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { Footer } from '../components/Footer';
import { 
  BookOpen, User, Mail, Calendar, Crown, LogOut, LayoutDashboard, Clock,
  CheckCircle, FileText, Play, XCircle, AlertTriangle, Loader2, Download, Trash2, Shield
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { t } = useLang();
  const [purchasedData, setPurchasedData] = useState(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchPurchasedExams(); }, []);

  const fetchPurchasedExams = async () => {
    try {
      const res = await axios.get(`${API}/user/purchased-exams`);
      setPurchasedData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingExams(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/user/export-data`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mockexamcenter-data-${user?.email}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error('Export error'); }
    finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.deleteConfirm'))) return;
    try {
      await axios.delete(`${API}/user/account`);
      toast.success(t('profile.deleteSuccess'));
      logout();
      navigate('/');
    } catch (err) { toast.error(t('profile.deleteError')); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const subscription = user?.subscription;
  const isExpired = subscription?.expires_at && new Date(subscription.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="profile-page">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600"><BookOpen className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/exams" className="nav-link">{t('nav.exams')}</Link>
            <Link to="/results" className="nav-link">{t('nav.myResults')}</Link>
            <Link to="/profile" className="nav-link">{t('nav.myExams')}</Link>
            {isAdmin && (<Link to="/admin" className="nav-link"><LayoutDashboard className="w-4 h-4 inline mr-1" />{t('nav.admin')}</Link>)}
            <LangSwitcher />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">{t('profile.title')}</h1>

        {/* User Info */}
        <Card className="card-shadow mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-blue-600" />{t('profile.personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{user?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                {isAdmin && (<Badge variant="secondary" className="bg-purple-100 text-purple-700"><Crown className="w-3 h-3 mr-1" />{t('profile.administrator')}</Badge>)}
              </div>
            </div>
            <div className="grid gap-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{user?.email}</span></div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{t('profile.registeredOn')} {formatDate(user?.created_at)}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="card-shadow mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" />{t('profile.subscription')}</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription && !isExpired ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-emerald-700">{subscription.type === 'all_access' ? t('profile.allAccess') : t('profile.singleAccess')}</span>
                </div>
                {subscription.expires_at && (
                  <div className="flex items-center gap-3 text-sm text-gray-600"><Clock className="w-4 h-4" /><span>{t('profile.expiresOn')} {formatDate(subscription.expires_at)}</span></div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">{isExpired ? t('profile.expired') : t('profile.noSubscription')}</p>
                <Button onClick={() => navigate('/payment')}>{t('profile.buyAccess')}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Exams */}
        <Card className="card-shadow mb-6" data-testid="my-exams-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" />{t('profile.myExamsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingExams ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : purchasedData?.exams?.length > 0 ? (
              <div className="space-y-3">
                {purchasedData.exams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors" data-testid={`purchased-exam-${exam.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{exam.name}</h4>
                        {exam.expired ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 shrink-0"><AlertTriangle className="w-3 h-3 mr-1" />{t('profile.expiredBadge')}</Badge>
                        ) : exam.has_access ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 shrink-0"><CheckCircle className="w-3 h-3 mr-1" />{t('profile.active')}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-200 shrink-0"><XCircle className="w-3 h-3 mr-1" />{t('profile.inactive')}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.duration_minutes} min</span>
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{exam.question_count} {t('exams.questions')}</span>
                        {exam.attempts_count > 0 && (
                          <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5" />{exam.attempts_count} {exam.attempts_count > 1 ? t('profile.attemptsPlural') : t('profile.attempts')}</span>
                        )}
                      </div>
                      {exam.latest_score !== null && exam.latest_score !== undefined && (
                        <div className="mt-1.5">
                          <span className={`text-sm font-medium ${exam.latest_passed ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t('profile.lastScore')} : {exam.latest_score}/{exam.max_score || 1000}
                            {exam.latest_passed ? ` — ${t('profile.passed')}` : ` — ${t('profile.failed')}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={exam.has_access && !exam.expired ? 'default' : 'outline'}
                      className={exam.has_access && !exam.expired ? 'gradient-primary ml-4 shrink-0' : 'ml-4 shrink-0'}
                      onClick={() => exam.has_access && !exam.expired ? navigate(`/exams/${exam.id}`) : navigate('/payment', { state: { examId: exam.id, examName: exam.name } })}
                      data-testid={`exam-action-${exam.id}`}
                    >
                      {exam.has_access && !exam.expired ? t('profile.takeExam') : t('profile.renew')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">{t('profile.noExams')}</p>
                <Button variant="outline" onClick={() => navigate('/exams')} data-testid="browse-exams-btn">{t('profile.browseExams')}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GDPR - Data Management */}
        <Card className="card-shadow mb-6" data-testid="gdpr-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />{t('profile.dataTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{t('profile.exportData')}</p>
                <p className="text-sm text-gray-500">{t('profile.exportDataDesc')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting} data-testid="export-data-btn">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-2" />{t('profile.exportData')}</>}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100">
              <div>
                <p className="font-medium text-red-700">{t('profile.deleteAccount')}</p>
                <p className="text-sm text-red-500">{t('profile.deleteAccountDesc')}</p>
              </div>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-100" onClick={handleDeleteAccount} data-testid="delete-account-btn">
                <Trash2 className="w-4 h-4 mr-2" />{t('profile.deleteAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="card-shadow">
          <CardContent className="p-6">
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />{t('nav.logout')}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
