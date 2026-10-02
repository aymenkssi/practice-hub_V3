import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen,
  LayoutDashboard,
  Upload,
  Trash2,
  ArrowLeft,
  HelpCircle,
  FileJson,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminQuestions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        axios.get(`${API}/exams/${examId}`),
        axios.get(`${API}/admin/questions/${examId}`)
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data.questions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Examen non trouvé');
      navigate('/admin/exams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Veuillez sélectionner un fichier JSON');
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('Le fichier doit contenir un tableau de questions');
      }

      const response = await axios.post(`${API}/admin/questions/import?exam_id=${examId}`, data);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Erreur d\'import';
      toast.error(message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAll = async () => {
    try {
      await axios.delete(`${API}/admin/questions/${examId}`);
      toast.success('Questions supprimées');
      setShowDeleteAll(false);
      setQuestions([]);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-questions">
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
              <Link to="/admin" className="nav-link">
                <LayoutDashboard className="w-4 h-4 inline mr-1" />
                Admin
              </Link>
              <span className="text-gray-400">/</span>
              <Link to="/admin/exams" className="nav-link">Examens</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Questions</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin/exams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux examens
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{exam?.name}</h1>
            <p className="text-gray-500">{questions.length} questions dans la banque</p>
          </div>
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              data-testid="import-questions-btn"
            >
              {isImporting ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Importer JSON
            </Button>
            
            {questions.length > 0 && (
              <Button 
                variant="outline"
                className="text-red-600"
                onClick={() => setShowDeleteAll(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tout supprimer
              </Button>
            )}
          </div>
        </div>

        {/* Upload Info */}
        <Card className="card-shadow mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileJson className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Format JSON attendu:</p>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
{`[
  {
    "id": 1,
    "domain": "Domain 1: Security",
    "question": "Votre question ?",
    "choices": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Explication..."
  }
]`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {questions.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="p-12 text-center">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucune question importée</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Importer des questions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.slice(0, 50).map((q, index) => (
              <Card key={q.id} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-mono">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{q.domain}</p>
                      <p className="text-sm line-clamp-2">{q.question}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{q.choices?.length || 0} choix</span>
                        <span>•</span>
                        <span className="text-emerald-600">Réponse: {String.fromCharCode(65 + (q.correct_answer || 0))}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {questions.length > 50 && (
              <p className="text-center text-gray-500 text-sm py-4">
                ... et {questions.length - 50} autres questions
              </p>
            )}
          </div>
        )}
      </main>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer toutes les questions ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera les {questions.length} questions de cet examen. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
