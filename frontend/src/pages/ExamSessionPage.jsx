import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';
import { useState } from 'react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ExamSessionPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    examConfig,
    questions,
    answers,
    currentQuestionIndex,
    currentQuestion,
    currentAnswer,
    timeRemaining,
    isExamActive,
    isPreviewMode,
    selectAnswer,
    toggleMarkQuestion,
    navigateToQuestion,
    finishExam,
    resetExam,
    setTimer
  } = useExam();

  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!isExamActive || isPreviewMode || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamActive, isPreviewMode]);

  // Redirect if no exam
  useEffect(() => {
    if (!isExamActive && questions.length === 0) {
      navigate(`/exams/${examId}`);
    }
  }, [isExamActive, questions.length, navigate, examId]);

  const handleFinishExam = async () => {
    setIsSaving(true);
    try {
      finishExam();
      
      // Save result if not preview
      if (!isPreviewMode && isAuthenticated) {
        const totalTime = examConfig?.duration_minutes ? examConfig.duration_minutes * 60 : 7200;
        await axios.post(`${API}/results`, {
          exam_id: examId,
          questions,
          answers,
          time_spent: totalTime - timeRemaining,
          completed: true
        });
      }
      
      navigate('/results');
    } catch (error) {
      console.error('Failed to save result:', error);
      toast.error('Erreur lors de la sauvegarde');
      navigate('/results');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExitExam = () => {
    resetExam();
    navigate(`/exams/${examId}`);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeRemaining / ((examConfig?.duration_minutes || 120) * 60)) * 100;
    if (percentage > 50) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage > 25) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200 animate-pulse';
  };

  const unansweredCount = answers.filter(a => a.selected_answer === null).length;
  const answeredCount = answers.filter(a => a.selected_answer !== null).length;
  const markedCount = answers.filter(a => a.is_marked).length;

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden" data-testid="exam-session-page">
      {/* Top Bar */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowExitDialog(true)}
              data-testid="exit-exam-btn"
            >
              <X className="w-4 h-4 mr-2" />
              Quitter
            </Button>
            
            {isPreviewMode && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <Eye className="w-3 h-3 mr-1" />
                Mode aperçu
              </Badge>
            )}
            
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                <span className="text-blue-600 font-semibold">{answeredCount}</span> répondues
              </span>
              <span className="text-gray-500">
                <span className="text-amber-600 font-semibold">{markedCount}</span> marquées
              </span>
            </div>
          </div>
          
          {!isPreviewMode && (
            <div className={cn("flex items-center gap-3 px-4 py-2 rounded-lg border", getTimerColor())}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-xl font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          
          <Button 
            onClick={() => setShowFinishDialog(true)}
            className="gradient-primary"
            data-testid="finish-exam-btn"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Terminer
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Navigator Sidebar */}
        <aside className="hidden lg:block w-64 xl:w-72 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Navigation</h3>
              <span className="text-xs text-gray-400">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 text-xs mb-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-200"></div>
                <span className="text-gray-500">Non répondu</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-3 h-3 rounded bg-blue-600"></div>
                <span className="text-gray-500">Répondu</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-gray-500">Marqué</span>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="grid grid-cols-5 gap-1.5 pr-4">
                {questions.map((_, index) => {
                  const answer = answers[index];
                  const isCurrent = index === currentQuestionIndex;
                  let statusClass = 'unanswered';
                  if (answer?.is_marked) statusClass = 'marked';
                  else if (answer?.selected_answer !== null) statusClass = 'answered';

                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={cn('question-nav-btn', statusClass, isCurrent && 'current')}
                      data-testid={`nav-question-${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Question Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Question Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Badge variant="outline">{currentQuestion.domain}</Badge>
                    <h2 className="text-sm text-gray-500 font-mono">
                      Question {currentQuestionIndex + 1} sur {questions.length}
                    </h2>
                  </div>
                  {!isPreviewMode && (
                    <Button
                      variant={currentAnswer?.is_marked ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleMarkQuestion(currentQuestion.id)}
                      className={cn(currentAnswer?.is_marked && "bg-amber-500 hover:bg-amber-600")}
                      data-testid="mark-question-btn"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      {currentAnswer?.is_marked ? 'Marquée' : 'Marquer'}
                    </Button>
                  )}
                </div>

                <p className="text-lg leading-relaxed text-gray-900" data-testid="question-text">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer Choices */}
              <RadioGroup
                value={currentAnswer?.selected_answer?.toString() ?? ''}
                onValueChange={(value) => selectAnswer(currentQuestion.id, parseInt(value))}
                className="space-y-3"
              >
                {currentQuestion.choices.map((choice, index) => (
                  <div key={index}>
                    <Label
                      htmlFor={`choice-${index}`}
                      className={cn(
                        "choice-option flex items-start gap-4 cursor-pointer",
                        currentAnswer?.selected_answer === index && "selected"
                      )}
                      data-testid={`choice-${index}`}
                    >
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`choice-${index}`}
                        className="mt-1"
                      />
                      <span className="flex-1">{choice}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Navigation Footer */}
          <footer className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                data-testid="prev-question-btn"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédente
              </Button>

              <div className="flex items-center gap-2 lg:hidden">
                <span className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
                data-testid="next-question-btn"
              >
                Suivante
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </footer>
        </main>
      </div>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent data-testid="finish-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer l'examen ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {unansweredCount > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{unansweredCount} question(s) non répondue(s)</span>
                </div>
              )}
              <p>Une fois terminé, vous ne pourrez plus modifier vos réponses.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-finish-btn">Continuer</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinishExam}
              disabled={isSaving}
              className="gradient-primary"
              data-testid="confirm-finish-btn"
            >
              {isSaving ? 'Sauvegarde...' : 'Terminer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent data-testid="exit-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter l'examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre progression sera perdue. Êtes-vous sûr ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExitExam}
              className="bg-red-600 hover:bg-red-700"
            >
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
