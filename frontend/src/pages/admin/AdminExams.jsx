import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen,
  LayoutDashboard,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  FileText,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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

const defaultFormData = {
  name: '',
  description: '',
  category_id: '',
  duration_minutes: 120,
  question_count: 100,
  passing_score: 700,
  max_score: 1000,
  domains: [],
  price_single: 9.99,
  price_all_access: 29.99,
  price_lifetime: 49.99,
  access_duration_days: 30,
  is_active: true
};

export default function AdminExams() {
  const navigate = useNavigate();
  
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [domainInput, setDomainInput] = useState({ name: '', weight: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, catsRes] = await Promise.all([
        axios.get(`${API}/admin/exams`),
        axios.get(`${API}/categories`)
      ]);
      setExams(examsRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingExam) {
        await axios.put(`${API}/admin/exams/${editingExam.id}`, formData);
        toast.success('Examen modifié');
      } else {
        await axios.post(`${API}/admin/exams`, formData);
        toast.success('Examen créé');
      }
      
      setShowDialog(false);
      setEditingExam(null);
      setFormData(defaultFormData);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description,
      category_id: exam.category_id,
      duration_minutes: exam.duration_minutes,
      question_count: exam.question_count,
      passing_score: exam.passing_score,
      max_score: exam.max_score,
      domains: exam.domains || [],
      price_single: exam.price_single,
      price_lifetime: exam.price_lifetime || 49.99,
      price_all_access: exam.price_all_access,
      access_duration_days: exam.access_duration_days,
      is_active: exam.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/admin/exams/${deleteId}`);
      toast.success('Examen supprimé');
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const addDomain = () => {
    if (domainInput.name && domainInput.weight) {
      setFormData({
        ...formData,
        domains: [...formData.domains, { name: domainInput.name, weight: parseInt(domainInput.weight) }]
      });
      setDomainInput({ name: '', weight: '' });
    }
  };

  const removeDomain = (index) => {
    setFormData({
      ...formData,
      domains: formData.domains.filter((_, i) => i !== index)
    });
  };

  const openNewDialog = () => {
    setEditingExam(null);
    setFormData(defaultFormData);
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-exams">
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
              <span className="text-gray-600">Examens</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Examens</h1>
          <Button onClick={openNewDialog} data-testid="add-exam-btn">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel examen
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : exams.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun examen</p>
              <Button onClick={openNewDialog}>Créer un examen</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-100">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{exam.name}</h3>
                          {!exam.is_active && (
                            <Badge variant="secondary" className="bg-gray-100">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactif
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{exam.category_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>{exam.duration_minutes}min</span>
                          <span>{exam.question_count} questions</span>
                          <span>{exam.total_questions} dans la banque</span>
                          <span>{exam.price_single}€</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                        data-testid={`questions-${exam.id}`}
                      >
                        <HelpCircle className="w-4 h-4 mr-1" />
                        Questions
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(exam)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-600"
                        onClick={() => setDeleteId(exam.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExam ? 'Modifier l\'examen' : 'Nouvel examen'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Durée (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nb questions</Label>
                <Input
                  type="number"
                  value={formData.question_count}
                  onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Score requis</Label>
                <Input
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Score max</Label>
                <Input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix unitaire (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_single}
                  onChange={(e) => setFormData({ ...formData, price_single: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée accès (jours)</Label>
                <Input
                  type="number"
                  value={formData.access_duration_days}
                  onChange={(e) => setFormData({ ...formData, access_duration_days: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix accès à vie (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_lifetime}
                  onChange={(e) => setFormData({ ...formData, price_lifetime: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix all access (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_all_access}
                  onChange={(e) => setFormData({ ...formData, price_all_access: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Domains */}
            <div className="space-y-2">
              <Label>Domaines</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom du domaine"
                  value={domainInput.name}
                  onChange={(e) => setDomainInput({ ...domainInput, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="%"
                  className="w-20"
                  value={domainInput.weight}
                  onChange={(e) => setDomainInput({ ...domainInput, weight: e.target.value })}
                />
                <Button type="button" variant="outline" onClick={addDomain}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.domains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.domains.map((d, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeDomain(i)}>
                      {d.name} ({d.weight}%) ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Examen actif</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingExam ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera également toutes les questions associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
