import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
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
import { TimerDisplay } from '../components/TimerDisplay';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { useExam } from '../context/ExamContext';
import { cn } from '../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getDomainShortName = (domain) => {
  const match = domain.match(/Domain \d+: (.+)/);
  return match ? match[1] : domain;
};

export default function ExamPage() {
  const navigate = useNavigate();
  const {
    questions,
    answers,
    currentQuestionIndex,
    currentQuestion,
    currentAnswer,
    timeRemaining,
    isExamActive,
    selectAnswer,
    toggleMarkQuestion,
    navigateToQuestion,
    finishExam,
    resetExam,
    EXAM_DURATION
  } = useExam();

  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isExamActive && questions.length === 0) {
      navigate('/');
    }
  }, [isExamActive, questions.length, navigate]);

  const handleFinishExam = async () => {
    setIsSaving(true);
    try {
      finishExam();
      
      // Save to backend
      const timeSpent = EXAM_DURATION - timeRemaining;
      const response = await axios.post(`${API}/exams`, {
        questions,
        answers,
        time_spent: timeSpent,
        completed: true
      });
      
      navigate(`/results/${response.data.id}`);
    } catch (error) {
      console.error('Failed to save exam:', error);
      toast.error('Erreur lors de la sauvegarde');
      // Still navigate to results even if save fails
      navigate('/results/local');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExitExam = () => {
    resetExam();
    navigate('/');
  };

  const unansweredCount = answers.filter(a => a.selected_answer === null).length;
  const answeredCount = answers.filter(a => a.selected_answer !== null).length;
  const markedCount = answers.filter(a => a.is_marked).length;

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" data-testid="exam-page">
      {/* Top Bar */}
      <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-xl px-4 py-3">
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
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="text-primary font-mono">{answeredCount}</span> répondues
              </span>
              <span className="text-muted-foreground">
                <span className="text-amber-400 font-mono">{markedCount}</span> marquées
              </span>
              <span className="text-muted-foreground">
                <span className="font-mono">{unansweredCount}</span> restantes
              </span>
            </div>
          </div>
          
          <TimerDisplay timeRemaining={timeRemaining} totalTime={EXAM_DURATION} />
          
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
        <aside className="hidden lg:block w-64 xl:w-72 border-r border-border bg-card/30 p-4 overflow-y-auto">
          <QuestionNavigator
            questions={questions}
            answers={answers}
            currentIndex={currentQuestionIndex}
            onSelect={navigateToQuestion}
          />
        </aside>

        {/* Question Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Question Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getDomainShortName(currentQuestion.domain)}
                    </span>
                    <h2 className="text-sm text-muted-foreground font-mono">
                      Question {currentQuestionIndex + 1} sur {questions.length}
                    </h2>
                  </div>
                  <Button
                    variant={currentAnswer?.is_marked ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMarkQuestion(currentQuestion.id)}
                    className={cn(
                      currentAnswer?.is_marked && "bg-amber-500 hover:bg-amber-600 text-black"
                    )}
                    data-testid="mark-question-btn"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    {currentAnswer?.is_marked ? 'Marquée' : 'Marquer'}
                  </Button>
                </div>

                <p className="text-lg leading-relaxed" data-testid="question-text">
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
          <footer className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-xl px-6 py-4">
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
                <span className="text-sm text-muted-foreground">
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

      {/* Finish Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent data-testid="finish-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer l'examen ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {unansweredCount > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{unansweredCount} question(s) non répondue(s)</span>
                </div>
              )}
              <p>Une fois terminé, vous ne pourrez plus modifier vos réponses.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-finish-btn">Continuer l'examen</AlertDialogCancel>
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

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent data-testid="exit-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter l'examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre progression sera perdue. Êtes-vous sûr de vouloir quitter ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-exit-btn">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExitExam}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="confirm-exit-btn"
            >
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
