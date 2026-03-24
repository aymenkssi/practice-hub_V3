import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { BookOpen, Search, Clock, FileText, ChevronRight, LogIn, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ExamsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { t } = useLang();
  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [catRes, examRes] = await Promise.all([axios.get(`${API}/categories`), axios.get(`${API}/exams`)]);
      setCategories(catRes.data);
      setExams(examRes.data);
    } catch (error) { console.error('Failed to fetch data:', error); }
    finally { setIsLoading(false); }
  };

  const filteredExams = exams.filter(exam => {
    const matchesCategory = !selectedCategory || exam.category_id === selectedCategory;
    const matchesSearch = !searchQuery || exam.name.toLowerCase().includes(searchQuery.toLowerCase()) || exam.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50" data-testid="exams-page">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600"><BookOpen className="w-6 h-6 text-white" /></div>
              <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/exams" className="nav-link active">{t('nav.exams')}</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/results" className="nav-link">{t('nav.myResults')}</Link>
                  <Link to="/profile" className="nav-link">{t('nav.myExams')}</Link>
                  {isAdmin && (<Link to="/admin" className="nav-link"><LayoutDashboard className="w-4 h-4 inline mr-1" />{t('nav.admin')}</Link>)}
                  <Link to="/profile"><Button variant="outline" size="sm">{user?.name}</Button></Link>
                </>
              ) : (
                <>
                  <Link to="/login"><Button variant="ghost" size="sm"><LogIn className="w-4 h-4 mr-2" />{t('nav.login')}</Button></Link>
                  <Link to="/register"><Button size="sm" className="gradient-primary">{t('nav.register')}</Button></Link>
                </>
              )}
              <LangSwitcher />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('exams.title')}</h1>
          <p className="text-gray-600">{t('exams.subtitle')}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder={t('exams.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="search-input" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)} data-testid="filter-all">{t('exams.all')}</Button>
            {categories.map(cat => (
              <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{t('exams.noExams')}</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map(exam => (
              <Card key={exam.id} className="card-shadow hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(`/exams/${exam.id}`)} data-testid={`exam-card-${exam.id}`}>
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3">{exam.category_name}</Badge>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{exam.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{exam.duration_minutes} {t('exams.minutes')}</span>
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{exam.question_count} {t('exams.questions')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm"><span className="text-gray-500">{t('exams.scoreRequired')}: </span><span className="font-semibold">{exam.passing_score}/{exam.max_score}</span></div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
