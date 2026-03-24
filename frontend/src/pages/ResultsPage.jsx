import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { 
  BookOpen, 
  Trophy,
  XCircle,
  Clock,
  ChevronRight,
  LogIn,
  LayoutDashboard,
  FileText,
  Home
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResultsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { examResult, isExamFinished, resetExam } = useExam();
  const { t } = useLang();
  
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResults();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API}/results`);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Show latest exam result if just finished
  const showLatestResult = isExamFinished && examResult;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="results-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link to="/exams" className="nav-link">{t('nav.exams')}</Link>
              <Link to="/results" className="nav-link active">{t('nav.myResults')}</Link>
              <Link to="/profile" className="nav-link">{t('nav.myExams')}</Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link">
                  <LayoutDashboard className="w-4 h-4 inline mr-1" />
                  {t('nav.admin')}
                </Link>
              )}
              <Link to="/profile">
                <Button variant="outline" size="sm">{user?.name}</Button>
              </Link>
              <LangSwitcher />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Latest Result Card */}
        {showLatestResult && (
          <Card className={cn(
            "card-shadow mb-8 overflow-hidden",
            examResult.passed ? "border-emerald-200" : "border-red-200"
          )}>
            <div className={cn(
              "p-6 text-center",
              examResult.passed ? "bg-emerald-50" : "bg-red-50"
            )}>
              {examResult.passed ? (
                <Trophy className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              )}
              
              <h2 className={cn(
                "text-4xl font-bold font-mono mb-2",
                examResult.passed ? "text-emerald-600" : "text-red-600"
              )}>
                {examResult.score} / {examResult.total_questions * 10}
              </h2>
              
              <p className={cn(
                "text-xl font-semibold mb-4",
                examResult.passed ? "text-emerald-700" : "text-red-700"
              )}>
                {examResult.passed ? "EXAMEN RÉUSSI" : "EXAMEN ÉCHOUÉ"}
              </p>

              <div className="flex justify-center gap-8 text-sm text-gray-600">
                <div>
                  <span className="block text-2xl font-semibold text-gray-900">
                    {examResult.correct_answers}/{examResult.total_questions}
                  </span>
                  Bonnes réponses
                </div>
                <div>
                  <span className="block text-2xl font-semibold text-gray-900">
                    {Math.round((examResult.correct_answers / examResult.total_questions) * 100)}%
                  </span>
                  Score
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => { resetExam(); navigate('/exams'); }}>
                  <Home className="w-4 h-4 mr-2" />
                  Retour aux examens
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results History */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Historique des résultats</h1>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results.length === 0 ? (
            <Card className="card-shadow">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucun résultat pour le moment</p>
                <Button onClick={() => navigate('/exams')}>
                  Passer un examen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card 
                  key={result.id}
                  className="card-shadow hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/results/${result.id}`)}
                  data-testid={`result-${result.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-full",
                          result.passed ? "bg-emerald-100" : "bg-red-100"
                        )}>
                          {result.passed ? (
                            <Trophy className="w-6 h-6 text-emerald-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">{result.exam_name}</h3>
                          <p className="text-sm text-gray-500">{formatDate(result.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold font-mono">{result.score}</p>
                          <p className="text-sm text-gray-500">
                            {result.correct_answers}/{result.total_questions} correct
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {formatDuration(result.time_spent)}
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Domain Progress */}
                    {result.domain_stats && result.domain_stats.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {result.domain_stats.slice(0, 3).map((stat, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500 truncate">{stat.domain}</span>
                                <span className={cn(
                                  "font-medium",
                                  stat.percentage >= 70 ? "text-emerald-600" : "text-red-600"
                                )}>{stat.percentage}%</span>
                              </div>
                              <Progress 
                                value={stat.percentage} 
                                className={cn(
                                  "h-1.5",
                                  stat.percentage >= 70 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-500"
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
