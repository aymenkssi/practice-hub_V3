import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ArrowLeft, ShoppingCart, Search, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/admin/orders`);
      setOrders(res.data);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const statusBadge = (status) => {
    if (status === 'completed') return <Badge className="bg-emerald-100 text-emerald-700 border-0"><CheckCircle className="w-3 h-3 mr-1" />Complété</Badge>;
    if (status === 'pending') return <Badge className="bg-amber-100 text-amber-700 border-0"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-0"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
  };

  const accessLabel = (type) => {
    const labels = { single: 'Examen unique', single_lifetime: 'Examen (à vie)', all_access: 'Tous les examens', all_access_lifetime: 'Tous (à vie)' };
    return labels[type] || type;
  };

  const filtered = orders.filter(o =>
    o.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('examprep - Historique des commandes', 14, 22);
    doc.setFontSize(10);
    doc.text(`Export du ${new Date().toLocaleDateString('fr-FR')} - ${filtered.length} commandes`, 14, 30);

    const rows = filtered.map(o => [
      formatDate(o.created_at),
      o.user_name,
      o.user_email,
      accessLabel(o.access_type),
      `${o.final_price}€`,
      o.status === 'completed' ? 'Complété' : o.status === 'pending' ? 'En attente' : o.status
    ]);

    doc.autoTable({
      startY: 36,
      head: [['Date', 'Utilisateur', 'Email', 'Type', 'Montant', 'Statut']],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    const totalRevenue = filtered.filter(o => o.status === 'completed').reduce((s, o) => s + (o.final_price || 0), 0);
    doc.setFontSize(11);
    doc.text(`Revenu total : ${totalRevenue.toFixed(2)}€`, 14, doc.lastAutoTable.finalY + 10);
    doc.save('commandes-mockexamcenter.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-orders">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600"><BookOpen className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">examprep</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/admin" className="nav-link"><LayoutDashboard className="w-4 h-4 inline mr-1" />Admin</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Commandes</span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin')}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Commandes</h1>
            <p className="text-gray-500">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
          </div>
          <Button variant="outline" onClick={exportPDF} data-testid="export-orders-pdf"><Download className="w-4 h-4 mr-2" />Exporter PDF</Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder="Rechercher par utilisateur ou description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          <Card className="card-shadow">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-blue-600" />Liste des commandes ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="orders-table">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Utilisateur</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Montant</th>
                      <th className="pb-3 font-medium">Coupon</th>
                      <th className="pb-3 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                        <td className="py-3"><div className="text-sm font-medium">{order.user_name}</div><div className="text-xs text-gray-400">{order.user_email}</div></td>
                        <td className="py-3"><Badge variant="outline" className="text-xs">{accessLabel(order.access_type)}</Badge></td>
                        <td className="py-3 text-sm text-gray-600 max-w-[200px] truncate">{order.description}</td>
                        <td className="py-3">
                          <span className="font-semibold">{order.final_price}€</span>
                          {order.discount_percent > 0 && <span className="text-xs text-emerald-600 ml-1">(-{order.discount_percent}%)</span>}
                        </td>
                        <td className="py-3 text-sm text-gray-500">{order.coupon_code || '-'}</td>
                        <td className="py-3">{statusBadge(order.status)}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">Aucune commande</td></tr>}
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
