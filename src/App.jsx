import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import BottomNav from './components/layout/BottomNav';
import ProtectedRoute from './components/layout/ProtectedRoute';
import SplashScreen from './components/ui/SplashScreen';
import useAuthStore from './stores/authStore';
import useTransactionStore from './stores/transactionStore';
import useCategoryStore from './stores/categoryStore';
import useWalletStore from './stores/walletStore';
import useDebtStore from './stores/debtStore';
import useObligationStore from './stores/obligationStore';
import useBudgetStore from './stores/budgetStore';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import WalletsPage from './pages/WalletsPage';
import DebtsPage from './pages/DebtsPage';
import ObligationsPage from './pages/ObligationsPage';
import AiPage from './pages/AiPage';
import AboutPage from './pages/AboutPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import DeleteAccountPolicyPage from './pages/DeleteAccountPolicyPage';
import DeleteAccountPage from './pages/DeleteAccountPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const fetchWallets = useWalletStore((s) => s.fetchWallets);
  const fetchDebts = useDebtStore((s) => s.fetchDebts);
  const fetchObligations = useObligationStore((s) => s.fetchObligations);
  const fetchBudgets = useBudgetStore((s) => s.fetchBudgets);

  // After auth confirmed, fetch all data
  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchCategories();
      fetchWallets();
      fetchDebts();
      fetchObligations();
      fetchBudgets();
    }
  }, [isAuthenticated, fetchTransactions, fetchCategories, fetchWallets, fetchDebts, fetchObligations, fetchBudgets]);

  // AppContent is only rendered after auth check completes (isLoading=false)

  return (
    <div className="app">
      <main className="app__content">
        <Routes>
          {/* Public routes — redirect to home if already logged in */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AiPage /></ProtectedRoute>} />
          <Route path="/wallets" element={<ProtectedRoute><WalletsPage /></ProtectedRoute>} />
          <Route path="/debts" element={<ProtectedRoute><DebtsPage /></ProtectedRoute>} />
          <Route path="/obligations" element={<ProtectedRoute><ObligationsPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Public info pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/delete-account-policy" element={<DeleteAccountPolicyPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
        </Routes>
      </main>
      {isAuthenticated && <BottomNav />}
    </div>
  );
}

export default function App() {
  const [splashAnimDone, setSplashAnimDone] = useState(false);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const handleSplashFinish = useCallback(() => setSplashAnimDone(true), []);

  // Run auth check at app level (not inside AppContent which is gated on isLoading)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show splash until BOTH animation finishes AND auth check completes
  const showSplash = !splashAnimDone || isLoading;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        {!showSplash && <AppContent />}
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
