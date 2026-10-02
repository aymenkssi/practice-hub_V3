import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen,
  Trophy,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResultDetailPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await axios.get(`${API}/results/${resultId}`);
      setResult(response.data);
    } catch (error) {
      console.error('Failed to fetch result:', error);
      navigate('/results');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) return null;

  const { questions, answers, score, passed, total_questions, correct_answers, time_spent, domain_stats, exam_name } = result;
  
  const answerMap = {};
  answers.forEach(a => { answerMap[a.question_id] = a; });
  
  const reviewQuestions = showOnlyFailed 
    ? questions.filter(q => !answerMap[q.id]?.is_correct)
    : questions;

  const currentReviewQuestion = reviewQuestions[reviewIndex];
  const currentReviewAnswer = currentReviewQuestion ? answerMap[currentReviewQuestion.id] : null;

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="result-detail-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">examprep</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/admin" className="nav-link">
                  <LayoutDashboard className="w-4 h-4 inline mr-1" />
                  Admin
                </Link>
              )}
              <Link to="/profile">
                <Button variant="outline" size="sm">{user?.name}</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/results')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux résultats
        </Button>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="review">Révision</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card className={cn(
              "card-shadow overflow-hidden",
              passed ? "border-emerald-200" : "border-red-200"
            )}>
              <div className={cn(
                "p-8 text-center",
                passed ? "bg-emerald-50" : "bg-red-50"
              )}>
                {passed ? (
                  <Trophy className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                )}
                
                <p className="text-sm text-gray-500 mb-2">{exam_name}</p>
                
                <h2 className={cn(
                  "text-4xl font-bold font-mono mb-2",
                  passed ? "text-emerald-600" : "text-red-600"
                )}>
                  {score} / {total_questions * 10}
                </h2>
                
                <p className={cn(
                  "text-xl font-semibold mb-6",
                  passed ? "text-emerald-700" : "text-red-700"
                )}>
                  {passed ? "EXAMEN RÉUSSI" : "EXAMEN ÉCHOUÉ"}
                </p>

                <div className="flex justify-center gap-8 text-sm text-gray-600">
                  <div>
                    <span className="block text-2xl font-semibold text-gray-900">
                      {correct_answers}/{total_questions}
                    </span>
                    Bonnes réponses
                  </div>
                  <div>
                    <span className="block text-2xl font-semibold text-gray-900">
                      {Math.round((correct_answers / total_questions) * 100)}%
                    </span>
                    Score
                  </div>
                  <div>
                    <span className="block text-2xl font-semibold text-gray-900">
                      {formatDuration(time_spent)}
                    </span>
                    Temps
                  </div>
                </div>
              </div>
            </Card>

            {/* Domain Stats */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Résultats par domaine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {domain_stats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{stat.domain}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono font-semibold",
                          stat.percentage >= 70 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {stat.percentage}%
                        </span>
                        <span className="text-sm text-gray-500">
                          ({stat.correct}/{stat.total})
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={stat.percentage} 
                      className={cn(
                        "h-2",
                        stat.percentage >= 70 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-500"
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant={showOnlyFailed ? "default" : "outline"}
                size="sm"
                onClick={() => { setShowOnlyFailed(!showOnlyFailed); setReviewIndex(0); }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Questions ratées ({answers.filter(a => !a.is_correct).length})
              </Button>
              <span className="text-sm text-gray-500 font-mono">
                {reviewIndex + 1} / {reviewQuestions.length}
              </span>
            </div>

            {currentReviewQuestion && (
              <Card className="card-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline">{currentReviewQuestion.domain}</Badge>
                      <div className="flex items-center gap-2">
                        {currentReviewAnswer?.is_correct ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle className="w-4 h-4" />
                            Incorrect
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg leading-relaxed">
                    {currentReviewQuestion.question}
                  </p>

                  <div className="space-y-3">
                    {currentReviewQuestion.choices.map((choice, index) => {
                      const isCorrect = index === currentReviewQuestion.correct_answer;
                      const isUserAnswer = index === currentReviewAnswer?.selected_answer;
                      const isWrongAnswer = isUserAnswer && !isCorrect;

                      return (
                        <div
                          key={index}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all",
                            isCorrect && "border-emerald-500 bg-emerald-50",
                            isWrongAnswer && "border-red-500 bg-red-50",
                            !isCorrect && !isWrongAnswer && "border-gray-200 bg-white"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              isCorrect && "bg-emerald-500 text-white",
                              isWrongAnswer && "bg-red-500 text-white",
                              !isCorrect && !isWrongAnswer && "bg-gray-200 text-gray-600"
                            )}>
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="flex-1">{choice}</span>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {isWrongAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {currentReviewQuestion.explanation && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                        <Eye className="w-4 h-4" />
                        Explication
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {currentReviewQuestion.explanation}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                      disabled={reviewIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Précédente
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReviewIndex(Math.min(reviewQuestions.length - 1, reviewIndex + 1))}
                      disabled={reviewIndex === reviewQuestions.length - 1}
                    >
                      Suivante
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {reviewQuestions.length === 0 && (
              <Card className="card-shadow">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Félicitations !</p>
                  <p className="text-gray-500">Aucune question ratée.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
