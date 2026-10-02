import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen,
  LayoutDashboard,
  Users,
  FileText,
  HelpCircle,
  Award,
  Tag,
  Settings,
  DollarSign,
  FolderOpen,
  LogOut,
  ShoppingCart
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: FolderOpen, label: 'Catégories', path: '/admin/categories', color: 'bg-purple-100 text-purple-600' },
    { icon: FileText, label: 'Examens', path: '/admin/exams', color: 'bg-blue-100 text-blue-600' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/users', color: 'bg-cyan-100 text-cyan-600' },
    { icon: ShoppingCart, label: 'Commandes', path: '/admin/orders', color: 'bg-green-100 text-green-600' },
    { icon: Tag, label: 'Coupons', path: '/admin/coupons', color: 'bg-amber-100 text-amber-600' },
    { icon: Settings, label: 'Paramètres', path: '/admin/settings', color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
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
              <Link to="/" className="nav-link">Site</Link>
              <Link to="/admin" className="nav-link active">
                <LayoutDashboard className="w-4 h-4 inline mr-1" />
                Admin
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-gray-500">Bienvenue, {user?.name}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.users || 0}</p>
              <p className="text-sm text-gray-500">Utilisateurs</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.exams || 0}</p>
              <p className="text-sm text-gray-500">Examens</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <HelpCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.questions || 0}</p>
              <p className="text-sm text-gray-500">Questions</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.results || 0}</p>
              <p className="text-sm text-gray-500">Résultats</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <Tag className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.orders || 0}</p>
              <p className="text-sm text-gray-500">Commandes</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.revenue || 0}€</p>
              <p className="text-sm text-gray-500">Revenus</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold mb-4">Gestion</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              className="card-shadow hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(item.path)}
              data-testid={`menu-${item.label.toLowerCase()}`}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="text-sm text-gray-500">Gérer les {item.label.toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
