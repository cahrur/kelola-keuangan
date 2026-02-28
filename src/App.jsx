import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/layout/BottomNav';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import WalletsPage from './pages/WalletsPage';
import DebtsPage from './pages/DebtsPage';
import ObligationsPage from './pages/ObligationsPage';

export default function App() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  return (
    <BrowserRouter>
      <div className="app">
        <main className="app__content">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  onAddTransaction={() => setShowTransactionForm(true)}
                />
              }
            />
            <Route
              path="/transactions"
              element={
                <TransactionsPage
                  showForm={showTransactionForm}
                  setShowForm={setShowTransactionForm}
                />
              }
            />
            <Route path="/wallets" element={<WalletsPage />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/obligations" element={<ObligationsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
