import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen,
  LayoutDashboard,
  ArrowLeft,
  Settings,
  DollarSign,
  Save,
  Key
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminSettings() {
  const navigate = useNavigate();
  
  const [pricing, setPricing] = useState({
    all_access_price: 29.99,
    all_access_duration_days: 30,
    all_access_lifetime_price: 99.99
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings/pricing`);
      setPricing(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API}/admin/settings/pricing`, pricing);
      toast.success('Paramètres sauvegardés');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
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
    <div className="min-h-screen bg-gray-50" data-testid="admin-settings">
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
              <span className="text-gray-600">Paramètres</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

        {/* Pricing Settings */}
        <Card className="card-shadow mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Tarification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              Le prix unitaire de chaque examen se définit dans les paramètres de l'examen.
              Ici, configurez uniquement le prix et la durée de l'accès complet à tous les examens.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix accès complet (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricing.all_access_price}
                  onChange={(e) => setPricing({ ...pricing, all_access_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée accès complet (jours)</Label>
                <Input
                  type="number"
                  value={pricing.all_access_duration_days}
                  onChange={(e) => setPricing({ ...pricing, all_access_duration_days: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix accès complet à vie (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricing.all_access_lifetime_price}
                  onChange={(e) => setPricing({ ...pricing, all_access_lifetime_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </CardContent>
        </Card>

        {/* PayPal Info */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Configuration PayPal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Pour activer les paiements PayPal, configurez les variables d'environnement suivantes dans le backend:
            </p>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
              <p>PAYPAL_CLIENT_ID=votre_client_id</p>
              <p>PAYPAL_SECRET=votre_secret</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Obtenez vos identifiants sur{' '}
              <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                developer.paypal.com
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
