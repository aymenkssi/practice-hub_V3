import { createContext, useContext, useState, useCallback } from 'react';

const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  const [examConfig, setExamConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExamActive, setIsExamActive] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const startExam = useCallback((config, loadedQuestions, preview = false) => {
    const initialAnswers = loadedQuestions.map(q => ({
      question_id: q.id,
      selected_answer: null,
      is_correct: false,
      is_marked: false
    }));

    setExamConfig(config);
    setQuestions(loadedQuestions);
    setAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    setTimeRemaining(preview ? 0 : (config.duration_minutes || 120) * 60);
    setIsExamActive(true);
    setIsExamFinished(false);
    setExamResult(null);
    setIsPreviewMode(preview);
  }, []);

  const selectAnswer = useCallback((questionId, answerIndex) => {
    setAnswers(prev => prev.map(a => {
      if (a.question_id === questionId) {
        const question = questions.find(q => q.id === questionId);
        const isCorrect = question ? question.correct_answer === answerIndex : false;
        return { ...a, selected_answer: answerIndex, is_correct: isCorrect };
      }
      return a;
    }));
  }, [questions]);

  const toggleMarkQuestion = useCallback((questionId) => {
    setAnswers(prev => prev.map(a => {
      if (a.question_id === questionId) {
        return { ...a, is_marked: !a.is_marked };
      }
      return a;
    }));
  }, []);

  const navigateToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  const finishExam = useCallback(() => {
    const totalTime = examConfig ? examConfig.duration_minutes * 60 : 7200;
    const timeSpent = totalTime - timeRemaining;
    const correctCount = answers.filter(a => a.is_correct).length;
    const maxScore = examConfig?.max_score || 1000;
    const score = Math.round((correctCount / questions.length) * maxScore);
    const passingScore = examConfig?.passing_score || 700;
    
    const result = {
      exam_id: examConfig?.exam_id,
      score,
      passed: score >= passingScore,
      total_questions: questions.length,
      correct_answers: correctCount,
      time_spent: timeSpent,
      questions,
      answers
    };

    setExamResult(result);
    setIsExamActive(false);
    setIsExamFinished(true);
  }, [examConfig, timeRemaining, answers, questions]);

  const resetExam = useCallback(() => {
    setExamConfig(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setTimeRemaining(0);
    setIsExamActive(false);
    setIsExamFinished(false);
    setExamResult(null);
    setIsPreviewMode(false);
  }, []);

  const setTimer = useCallback((time) => {
    setTimeRemaining(time);
  }, []);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const currentAnswer = answers.find(a => a.question_id === currentQuestion?.id) || null;

  const value = {
    examConfig,
    questions,
    answers,
    currentQuestionIndex,
    currentQuestion,
    currentAnswer,
    timeRemaining,
    isExamActive,
    isExamFinished,
    examResult,
    isPreviewMode,
    startExam,
    selectAnswer,
    toggleMarkQuestion,
    navigateToQuestion,
    finishExam,
    resetExam,
    setTimer
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};
