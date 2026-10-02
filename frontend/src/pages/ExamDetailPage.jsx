import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { BookOpen, Clock, FileText, Award, Play, Eye, Lock, CheckCircle, ArrowLeft, ShoppingCart, LogIn, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ExamDetailPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, hasAccess } = useAuth();
  const { startExam } = useExam();
  const { t } = useLang();
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const userHasAccess = hasAccess(examId);

  useEffect(() => { fetchExam(); }, [examId]);

  const fetchExam = async () => {
    try {
      const response = await axios.get(`${API}/exams/${examId}`);
      setExam(response.data);
    } catch (error) {
      toast.error(t('examDetail.notFound'));
      navigate('/exams');
    } finally { setIsLoading(false); }
  };

  const handleStartExam = async (preview = false) => {
    if (!isAuthenticated) { toast.error(t('examDetail.loginRequired')); navigate('/login'); return; }
    setIsStarting(true);
    try {
      const endpoint = preview ? `${API}/exams/${examId}/preview` : `${API}/exams/${examId}/questions`;
      const response = await axios.get(endpoint);
      if (response.data.questions.length === 0) { toast.error(t('examDetail.noQuestions')); return; }
      startExam({ exam_id: examId, exam_name: exam.name, duration_minutes: preview ? 0 : exam.duration_minutes, passing_score: exam.passing_score, max_score: exam.max_score }, response.data.questions, preview || response.data.preview);
      navigate(`/exam/${examId}/session`);
    } catch (error) { toast.error(error.response?.data?.detail || t('examDetail.loadError')); }
    finally { setIsStarting(false); }
  };

  const handleBuyAccess = () => navigate('/payment', { state: { examId, examName: exam?.name } });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!exam) return null;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="exam-detail-page">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600"><BookOpen className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">examprep</span>
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (<Link to="/admin" className="nav-link"><LayoutDashboard className="w-4 h-4 inline mr-1" />{t('nav.admin')}</Link>)}
                <Link to="/profile"><Button variant="outline" size="sm">{user?.name}</Button></Link>
              </>
            ) : (
              <Link to="/login"><Button size="sm" className="gradient-primary"><LogIn className="w-4 h-4 mr-2" />{t('nav.login')}</Button></Link>
            )}
            <LangSwitcher />
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/exams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />{t('examDetail.backToExams')}
        </Button>

        <div className="bg-white rounded-2xl card-shadow p-8 mb-6">
          <Badge variant="secondary" className="mb-4">{exam.category_name}</Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{exam.name}</h1>
          <p className="text-gray-600 mb-6">{exam.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{exam.duration_minutes}</p>
              <p className="text-sm text-gray-500">{t('examDetail.minutes')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <FileText className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{exam.question_count}</p>
              <p className="text-sm text-gray-500">{t('examDetail.questions')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Award className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{exam.passing_score}</p>
              <p className="text-sm text-gray-500">{t('examDetail.requiredScore')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{exam.total_questions}</p>
              <p className="text-sm text-gray-500">{t('examDetail.inBank')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {userHasAccess || isAdmin ? (
              <Button size="lg" className="gradient-primary flex-1" onClick={() => handleStartExam(false)} disabled={isStarting || exam.total_questions < exam.question_count} data-testid="start-exam-btn">
                <Play className="w-5 h-5 mr-2" />{t('examDetail.startFull')}
              </Button>
            ) : (
              <>
                <Button size="lg" variant="outline" className="flex-1" onClick={() => handleStartExam(true)} disabled={isStarting} data-testid="preview-exam-btn">
                  <Eye className="w-5 h-5 mr-2" />{t('examDetail.freePreview')}
                </Button>
                <Button size="lg" className="gradient-primary flex-1" onClick={handleBuyAccess} data-testid="buy-access-btn">
                  <ShoppingCart className="w-5 h-5 mr-2" />{t('examDetail.buyAccess')} ({exam.price_single}€)
                </Button>
              </>
            )}
          </div>
          {exam.total_questions < exam.question_count && (
            <p className="text-amber-600 text-sm mt-4 text-center">{t('examDetail.notEnoughQuestions')} ({exam.total_questions}/{exam.question_count})</p>
          )}
        </div>

        {exam.domains?.length > 0 && (
          <Card className="card-shadow">
            <CardHeader><CardTitle>{t('examDetail.domainsTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {exam.domains.map((domain, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="font-medium">{domain.name}</span><span className="text-gray-500">{domain.weight}%</span></div>
                  <Progress value={domain.weight} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!userHasAccess && !isAdmin && (
          <Card className="card-shadow mt-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('examDetail.fullAccessRequired')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{t('examDetail.fullAccessDesc')}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="sm" onClick={handleBuyAccess}>{t('examDetail.thisExam')} : {exam.price_single}€ / {exam.access_duration_days} {t('examDetail.days')}</Button>
                    <Button size="sm" variant="secondary" onClick={handleBuyAccess}>{t('examDetail.thisExam')} ({t('payment.lifetime')}) : {exam.price_lifetime ?? 49.99}€</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate('/payment', { state: { allAccess: true } })}>{t('examDetail.allExams')} : {exam.price_all_access}€</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
