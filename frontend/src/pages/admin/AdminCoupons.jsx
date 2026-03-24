import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen,
  LayoutDashboard,
  Plus,
  Trash2,
  ArrowLeft,
  Tag,
  Copy,
  Calendar,
  Hash
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
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

export default function AdminCoupons() {
  const navigate = useNavigate();
  
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: 10,
    valid_until: '',
    max_uses: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/admin/coupons`);
      setCoupons(response.data);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until || null
      };
      
      await axios.post(`${API}/admin/coupons`, data);
      toast.success('Coupon créé');
      setShowDialog(false);
      setFormData({ code: '', discount_percent: 10, valid_until: '', max_uses: '' });
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/admin/coupons/${deleteId}`);
      toast.success('Coupon supprimé');
      setDeleteId(null);
      fetchCoupons();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Illimité';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-coupons">
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
              <Link to="/admin" className="nav-link">
                <LayoutDashboard className="w-4 h-4 inline mr-1" />
                Admin
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Coupons</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Coupons de réduction</h1>
          <Button onClick={() => setShowDialog(true)} data-testid="add-coupon-btn">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau coupon
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : coupons.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="p-12 text-center">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun coupon</p>
              <Button onClick={() => setShowDialog(true)}>Créer un coupon</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-amber-100">
                        <Tag className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-bold font-mono">{coupon.code}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyCode(coupon.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <Badge 
                            variant="secondary" 
                            className={coupon.discount_percent === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                          >
                            -{coupon.discount_percent}%
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(coupon.valid_until)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {coupon.uses_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''} utilisations
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-600"
                      onClick={() => setDeleteId(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau coupon</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CODE2024"
                  required
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  Générer
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount">Réduction (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-gray-500">De 0% à 100% (gratuit)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valide jusqu'au (optionnel)</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_uses">Nombre max d'utilisations (optionnel)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="Illimité"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce coupon ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
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
