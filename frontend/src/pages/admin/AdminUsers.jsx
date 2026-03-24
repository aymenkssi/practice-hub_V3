import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ArrowLeft, Users, Search, Crown, Trash2, Calendar, Mail, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/admin/users`);
      setUsers(res.data);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Supprimer l'utilisateur "${userName}" et toutes ses données ?`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast.success('Utilisateur supprimé');
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const admins = filtered.filter(u => u.role === 'admin');
  const regulars = filtered.filter(u => u.role !== 'admin');

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-users">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600"><BookOpen className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/admin" className="nav-link"><LayoutDashboard className="w-4 h-4 inline mr-1" />Admin</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Utilisateurs</span>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Retour
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Utilisateurs</h1>
            <p className="text-gray-500">{users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-users"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Liste des utilisateurs ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="users-table">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Utilisateur</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Rôle</th>
                      <th className="pb-3 font-medium">Abonnement</th>
                      <th className="pb-3 font-medium">Inscription</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors" data-testid={`user-row-${user.id}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-sm text-gray-600 flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{user.email}</span>
                        </td>
                        <td className="py-3">
                          {user.role === 'admin' ? (
                            <Badge className="bg-purple-100 text-purple-700 border-0"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">Utilisateur</Badge>
                          )}
                        </td>
                        <td className="py-3">
                          {user.subscription ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                              <Shield className="w-3 h-3 mr-1" />
                              {user.subscription.type === 'all_access' ? 'Tous les examens' : 'Examen unique'}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">Aucun</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(user.created_at)}</span>
                        </td>
                        <td className="py-3 text-right">
                          {user.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(user.id, user.name)}
                              data-testid={`delete-user-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">Aucun utilisateur trouvé</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
