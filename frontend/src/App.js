import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ExamProvider } from "./context/ExamContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CookieConsent } from "./components/CookieConsent";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ExamsPage from "./pages/ExamsPage";
import ExamDetailPage from "./pages/ExamDetailPage";
import ExamSessionPage from "./pages/ExamSessionPage";
import ResultsPage from "./pages/ResultsPage";
import ResultDetailPage from "./pages/ResultDetailPage";
import ProfilePage from "./pages/ProfilePage";
import PaymentPage from "./pages/PaymentPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminExams from "./pages/admin/AdminExams";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";

import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/exams" element={<ExamsPage />} />
      <Route path="/exams/:examId" element={<ExamDetailPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      
      {/* Protected Routes */}
      <Route path="/exam/:examId/session" element={
        <ProtectedRoute><ExamSessionPage /></ProtectedRoute>
      } />
      <Route path="/results" element={
        <ProtectedRoute><ResultsPage /></ProtectedRoute>
      } />
      <Route path="/results/:resultId" element={
        <ProtectedRoute><ResultDetailPage /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      } />
      <Route path="/payment" element={
        <ProtectedRoute><PaymentPage /></ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute><AdminDashboard /></AdminRoute>
      } />
      <Route path="/admin/categories" element={
        <AdminRoute><AdminCategories /></AdminRoute>
      } />
      <Route path="/admin/exams" element={
        <AdminRoute><AdminExams /></AdminRoute>
      } />
      <Route path="/admin/exams/:examId/questions" element={
        <AdminRoute><AdminQuestions /></AdminRoute>
      } />
      <Route path="/admin/coupons" element={
        <AdminRoute><AdminCoupons /></AdminRoute>
      } />
      <Route path="/admin/settings" element={
        <AdminRoute><AdminSettings /></AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute><AdminUsers /></AdminRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ExamProvider>
          <BrowserRouter>
            <AppRoutes />
            <CookieConsent />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </ExamProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
