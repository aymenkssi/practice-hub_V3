import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ArrowLeft, TrendingUp, Users, DollarSign, Download, ShoppingCart, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/admin/analytics`);
      setData(res.data);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const accessLabel = (type) => {
    const labels = { single: 'Examen unique', single_lifetime: 'Examen (à vie)', all_access: 'Tous les examens', all_access_lifetime: 'Tous (à vie)' };
    return labels[type] || type;
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('examprep - Rapport Analytics', 14, 22);
    doc.setFontSize(10);
    doc.text(`Rapport du ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

    // Summary
    doc.setFontSize(14);
    doc.text('Vue d\'ensemble', 14, 42);
    doc.autoTable({
      startY: 48,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Utilisateurs', data.totals.users],
        ['Examens', data.totals.exams],
        ['Commandes complétées', data.totals.completed_orders],
        ['Revenu total', `${data.totals.revenue}€`],
        ['Résultats d\'examens', data.totals.results],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Revenue by month
    if (data.revenue_chart?.length > 0) {
      doc.setFontSize(14);
      doc.text('Revenus mensuels', 14, doc.lastAutoTable.finalY + 14);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Mois', 'Revenus', 'Commandes']],
        body: data.revenue_chart.map(r => [r.month, `${r.revenue}€`, r.orders]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129] }
      });
    }

    // Exam popularity
    if (data.exam_stats?.length > 0) {
      doc.setFontSize(14);
      doc.text('Popularité des examens', 14, doc.lastAutoTable.finalY + 14);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Examen', 'Tentatives', 'Commandes', 'Revenus']],
        body: data.exam_stats.map(e => [e.name, e.results, e.orders, `${e.revenue}€`]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] }
      });
    }

    doc.save('analytics-mockexamcenter.pdf');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const pieData = data?.access_types ? Object.entries(data.access_types).map(([k, v]) => ({ name: accessLabel(k), value: v })) : [];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-analytics">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600"><BookOpen className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">examprep</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/admin" className="nav-link"><LayoutDashboard className="w-4 h-4 inline mr-1" />Admin</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Analytics</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin')}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <Button variant="outline" onClick={exportPDF} data-testid="export-analytics-pdf"><Download className="w-4 h-4 mr-2" />Exporter PDF</Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100"><Users className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{data?.totals.users}</p><p className="text-xs text-gray-500">Utilisateurs</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                <div><p className="text-2xl font-bold">{data?.totals.revenue}€</p><p className="text-xs text-gray-500">Revenu total</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100"><ShoppingCart className="w-5 h-5 text-purple-600" /></div>
                <div><p className="text-2xl font-bold">{data?.totals.completed_orders}</p><p className="text-xs text-gray-500">Commandes</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100"><FileText className="w-5 h-5 text-amber-600" /></div>
                <div><p className="text-2xl font-bold">{data?.totals.results}</p><p className="text-xs text-gray-500">Examens passés</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card className="card-shadow">
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" />Revenus mensuels</CardTitle></CardHeader>
            <CardContent>
              {data?.revenue_chart?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.revenue_chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}€`, 'Revenus']} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-12">Aucune donnée</p>}
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card className="card-shadow">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Croissance utilisateurs</CardTitle></CardHeader>
            <CardContent>
              {data?.users_chart?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.users_chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-12">Aucune donnée</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Access Type Distribution */}
          <Card className="card-shadow">
            <CardHeader><CardTitle>Répartition des types d'accès</CardTitle></CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-12">Aucune donnée</p>}
            </CardContent>
          </Card>

          {/* Exam Popularity */}
          <Card className="card-shadow">
            <CardHeader><CardTitle>Popularité des examens</CardTitle></CardHeader>
            <CardContent>
              {data?.exam_stats?.length > 0 ? (
                <div className="space-y-3">
                  {data.exam_stats.map((exam, i) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-300">#{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{exam.name}</p>
                          <p className="text-xs text-gray-500">{exam.results} tentatives · {exam.orders} ventes</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">{exam.revenue}€</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-gray-400 py-12">Aucune donnée</p>}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="card-shadow">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-blue-600" />Dernières commandes</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Utilisateur</th>
                  <th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Montant</th><th className="pb-3 font-medium">Statut</th>
                </tr></thead>
                <tbody className="divide-y">
                  {data?.recent_orders?.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="py-2 text-sm">{o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : 'N/A'}</td>
                      <td className="py-2"><span className="text-sm font-medium">{o.user_name}</span></td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{accessLabel(o.access_type)}</Badge></td>
                      <td className="py-2 font-semibold text-sm">{o.final_price}€</td>
                      <td className="py-2"><Badge className={o.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>{o.status === 'completed' ? 'Complété' : 'En attente'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
