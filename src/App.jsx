import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
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
import useSettingsStore from './stores/settingsStore';
import { scheduleNightlyReminder } from './utils/notification';

// Auth pages — keep eager for fast initial load
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Lazy-loaded pages — only downloaded when navigated to
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WalletsPage = lazy(() => import('./pages/WalletsPage'));
const DebtsPage = lazy(() => import('./pages/DebtsPage'));
const ObligationsPage = lazy(() => import('./pages/ObligationsPage'));
const AiPage = lazy(() => import('./pages/AiPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const DeleteAccountPolicyPage = lazy(() => import('./pages/DeleteAccountPolicyPage'));
const DeleteAccountPage = lazy(() => import('./pages/DeleteAccountPage'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const fetchWallets = useWalletStore((s) => s.fetchWallets);
  const fetchDebts = useDebtStore((s) => s.fetchDebts);
  const fetchObligations = useObligationStore((s) => s.fetchObligations);
  const fetchBudgets = useBudgetStore((s) => s.fetchBudgets);
  const notificationEnabled = useSettingsStore((s) => s.notificationEnabled);

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

  // Notification scheduler — runs when user is authenticated and feature enabled
  useEffect(() => {
    if (isAuthenticated && notificationEnabled) {
      scheduleNightlyReminder(true);
      return () => scheduleNightlyReminder(false);
    }
    scheduleNightlyReminder(false);
  }, [isAuthenticated, notificationEnabled]);

  // AppContent is only rendered after auth check completes (isLoading=false)

  return (
    <div className="app">
      <main className="app__content">
        <Suspense fallback={null}>
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
        </Suspense>
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
