import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import BottomNav from './components/layout/BottomNav';
import ProtectedRoute from './components/layout/ProtectedRoute';
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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const fetchWallets = useWalletStore((s) => s.fetchWallets);
  const fetchDebts = useDebtStore((s) => s.fetchDebts);
  const fetchObligations = useObligationStore((s) => s.fetchObligations);
  const fetchBudgets = useBudgetStore((s) => s.fetchBudgets);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" />
      </div>
    );
  }

  return (
    <div className="app">
      <main className="app__content">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/wallets" element={<ProtectedRoute><WalletsPage /></ProtectedRoute>} />
          <Route path="/debts" element={<ProtectedRoute><DebtsPage /></ProtectedRoute>} />
          <Route path="/obligations" element={<ProtectedRoute><ObligationsPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </main>
      {isAuthenticated && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
