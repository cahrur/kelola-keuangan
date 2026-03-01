import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import useTransactionStore from '../stores/transactionStore';
import useBudgetStore from '../stores/budgetStore';
import useCategoryStore from '../stores/categoryStore';
import useSettingsStore from '../stores/settingsStore';
import { formatCurrency } from '../utils/formatters';
import { MONTHS } from '../utils/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import CurrencyInput from '../components/ui/CurrencyInput';
import './BudgetsPage.css';

export default function BudgetsPage() {
    const { transactions } = useTransactionStore();
    const { budgets, setBudget, removeBudget, getBudgetsForMonth } = useBudgetStore();
    const { categories } = useCategoryStore();
    const { currency } = useSettingsStore();

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [showForm, setShowForm] = useState(false);
    const [formCategory, setFormCategory] = useState('');
    const [formAmount, setFormAmount] = useState('');

    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const monthBudgets = useMemo(() => getBudgetsForMonth(selectedMonth, selectedYear), [budgets, selectedMonth, selectedYear]);

    const getSpentForCategory = (categoryId) => {
        return transactions
            .filter((t) => {
                const d = new Date(t.date);
                return (
                    t.type === 'expense' &&
                    t.categoryId === categoryId &&
                    d.getMonth() === selectedMonth &&
                    d.getFullYear() === selectedYear
                );
            })
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formCategory || !formAmount) return;
        setBudget({
            categoryId: formCategory,
            month: selectedMonth,
            year: selectedYear,
            amount: parseFloat(formAmount),
        });
        setShowForm(false);
        setFormCategory('');
        setFormAmount('');
    };

    const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = monthBudgets.reduce((s, b) => s + getSpentForCategory(b.categoryId), 0);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Anggaran</h1>
                <p className="page-subtitle">Kelola budget pengeluaran bulanan</p>
            </div>

            {/* Month Selector */}
            <div className="month-selector">
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                    {MONTHS.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                    ))}
                </select>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* Total Overview */}
            {monthBudgets.length > 0 && (
                <Card className="budget-overview mb-lg animate-scale-in">
                    <div className="budget-overview__row">
                        <div>
                            <span className="budget-overview__label">Total Anggaran</span>
                            <span className="budget-overview__value">{formatCurrency(totalBudget, currency)}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="budget-overview__label">Terpakai</span>
                            <span className={`budget-overview__value ${totalSpent > totalBudget ? 'text-expense' : 'text-income'}`}>
                                {formatCurrency(totalSpent, currency)}
                            </span>
                        </div>
                    </div>
                    <div className="budget-progress__bar">
                        <div
                            className={`budget-progress__fill ${totalSpent / totalBudget > 0.9 ? 'budget-progress__fill--danger' : totalSpent / totalBudget > 0.7 ? 'budget-progress__fill--warning' : ''}`}
                            style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="budget-overview__remaining text-muted" style={{ fontSize: 'var(--font-xs)', marginTop: '8px' }}>
                        Sisa: {formatCurrency(Math.max(totalBudget - totalSpent, 0), currency)}
                    </p>
                </Card>
            )}

            <Button fullWidth className="mb-lg" onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
                Tambah Anggaran
            </Button>

            {/* Budget Cards */}
            <div className="stagger-children">
                {monthBudgets.length === 0 ? (
                    <EmptyState
                        icon={<AlertTriangle size={48} />}
                        title="Belum ada anggaran"
                        description="Buat anggaran untuk memantau pengeluaran bulanan kamu"
                    />
                ) : (
                    monthBudgets.map((budget) => {
                        const category = categories.find((c) => c.id === budget.categoryId);
                        const spent = getSpentForCategory(budget.categoryId);
                        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                        const isOver = percentage > 100;
                        const isWarning = percentage > 80 && !isOver;

                        return (
                            <Card key={budget.id} className="budget-card mb-sm">
                                <div className="budget-card__header">
                                    <div className="budget-card__cat">
                                        <div
                                            className="category-card__icon"
                                            style={{ background: category?.color + '20', color: category?.color, width: 32, height: 32, fontSize: 'var(--font-xs)' }}
                                        >
                                            {category?.name?.charAt(0) || '?'}
                                        </div>
                                        <span className="budget-card__name">{category?.name || 'Kategori'}</span>
                                    </div>
                                    <div className="budget-card__status">
                                        {isOver ? (
                                            <span className="budget-badge budget-badge--danger">
                                                <AlertTriangle size={12} /> Melebihi
                                            </span>
                                        ) : isWarning ? (
                                            <span className="budget-badge budget-badge--warning">
                                                <AlertTriangle size={12} /> Hampir
                                            </span>
                                        ) : (
                                            <span className="budget-badge budget-badge--safe">
                                                <CheckCircle size={12} /> Aman
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="budget-card__amounts">
                                    <span className={isOver ? 'text-expense' : ''}>
                                        {formatCurrency(spent, currency)}
                                    </span>
                                    <span className="text-muted">/ {formatCurrency(budget.amount, currency)}</span>
                                </div>
                                <div className="budget-progress__bar">
                                    <div
                                        className={`budget-progress__fill ${isOver ? 'budget-progress__fill--danger' : isWarning ? 'budget-progress__fill--warning' : ''}`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>
                                <div className="budget-card__footer">
                                    <span className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>
                                        {Math.round(percentage)}% terpakai
                                    </span>
                                    <button className="txn-action-btn txn-action-btn--danger" onClick={() => removeBudget(budget.id)}>
                                        <span style={{ fontSize: 'var(--font-xs)' }}>Hapus</span>
                                    </button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Add Budget Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Anggaran">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Kategori Pengeluaran</label>
                        <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required>
                            <option value="">Pilih Kategori</option>
                            {expenseCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Batas Anggaran</label>
                        <CurrencyInput
                            placeholder="0"
                            value={formAmount}
                            onChange={(val) => setFormAmount(val)}
                            required
                        />
                    </div>
                    <Button type="submit" fullWidth className="mt-md">
                        Simpan Anggaran
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
