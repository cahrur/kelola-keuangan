import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useTransactionStore from '../stores/transactionStore';
import useCategoryStore from '../stores/categoryStore';
import useSettingsStore from '../stores/settingsStore';
import useAIStore from '../stores/aiStore';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import { MONTHS } from '../utils/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';
import './DashboardPage.css';

export default function DashboardPage({ onAddTransaction }) {
    const navigate = useNavigate();
    const { transactions, getTotalByType, getMonthlyData } = useTransactionStore();
    const { getCategoryById } = useCategoryStore();
    const { currency } = useSettingsStore();
    const { insight, insightLoading, fetchInsight, refreshInsight } = useAIStore();

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const income = getTotalByType('income', month, year);
    const expense = getTotalByType('expense', month, year);
    const balance = income - expense;

    // Fetch AI insight on mount
    useEffect(() => {
        fetchInsight();
    }, []);

    const chartData = useMemo(() => {
        const data = getMonthlyData(year);
        return data
            .filter((_, i) => i <= month)
            .map((d) => ({
                name: MONTHS[d.month].slice(0, 3),
                Pemasukan: d.income,
                Pengeluaran: d.expense,
            }));
    }, [transactions, month, year]);

    const recentTransactions = useMemo(() => {
        return transactions.slice(0, 5);
    }, [transactions]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload) return null;
        return (
            <div className="chart-tooltip">
                <p className="chart-tooltip__label">{label}</p>
                {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color }} className="chart-tooltip__value">
                        {p.name}: {formatCurrency(p.value, currency)}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="page-container">
            <PageHeader title="Dashboard" />

            {/* AI Insight */}
            <div className="ai-suggest animate-slide-up">
                <div className="ai-suggest__header">
                    <Sparkles size={14} />
                    <span>AI Insight</span>
                    <button
                        className="ai-suggest__refresh"
                        onClick={refreshInsight}
                        disabled={insightLoading}
                        title="Refresh insight"
                    >
                        <RefreshCw size={14} className={insightLoading ? 'spin' : ''} />
                    </button>
                </div>
                <div className="ai-suggest__tips">
                    {insightLoading ? (
                        <>
                            <div className="ai-suggest__skeleton" />
                            <div className="ai-suggest__skeleton ai-suggest__skeleton--short" />
                        </>
                    ) : insight?.content ? (
                        insight.content.split('\n').filter(Boolean).slice(0, 3).map((line, i) => (
                            <p key={i} className="ai-suggest__tip">{line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/, '')}</p>
                        ))
                    ) : (
                        <p className="ai-suggest__tip">Memuat insight keuangan...</p>
                    )}
                </div>
            </div>

            {/* Balance Card */}
            <Card glow className="balance-card animate-scale-in">
                <div className="balance-card__label">
                    <Wallet size={16} />
                    <span>Saldo Bulan Ini</span>
                </div>
                <div className={`balance-card__amount ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(balance, currency)}
                </div>
                <div className="balance-card__row">
                    <div className="balance-card__stat">
                        <div className="balance-card__icon balance-card__icon--income">
                            <TrendingUp size={14} />
                        </div>
                        <div>
                            <span className="balance-card__stat-label">Pemasukan</span>
                            <span className="balance-card__stat-value text-income">
                                {formatCurrency(income, currency)}
                            </span>
                        </div>
                    </div>
                    <div className="balance-card__stat">
                        <div className="balance-card__icon balance-card__icon--expense">
                            <TrendingDown size={14} />
                        </div>
                        <div>
                            <span className="balance-card__stat-label">Pengeluaran</span>
                            <span className="balance-card__stat-value text-expense">
                                {formatCurrency(expense, currency)}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Chart */}
            {chartData.length > 0 && (
                <div className="mt-lg">
                    <h2 className="section-title">Tren {year}</h2>
                    <Card className="chart-card">
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#98503b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#98503b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8a9290', fontSize: 11 }}
                                />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="Pemasukan"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fill="url(#gradIncome)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Pengeluaran"
                                    stroke="#98503b"
                                    strokeWidth={2}
                                    fill="url(#gradExpense)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="mt-lg">
                <h2 className="section-title">
                    Transaksi Terbaru
                    {transactions.length > 5 && (
                        <button className="see-all-btn" onClick={() => navigate('/transactions')}>
                            Lihat Semua <ArrowRight size={14} />
                        </button>
                    )}
                </h2>
                <div className="stagger-children">
                    {recentTransactions.length === 0 ? (
                        <Card>
                            <p className="text-muted" style={{ textAlign: 'center', padding: '16px 0' }}>
                                Belum ada transaksi
                            </p>
                        </Card>
                    ) : (
                        recentTransactions.map((txn) => {
                            const category = getCategoryById(txn.categoryId);
                            return (
                                <Card key={txn.id} className="txn-item" onClick={() => navigate('/transactions')}>
                                    <div
                                        className="txn-item__icon"
                                        style={{ background: category?.color + '20', color: category?.color }}
                                    >
                                        {category?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="txn-item__info">
                                        <span className="txn-item__desc">{txn.description}</span>
                                        <span className="txn-item__cat">{category?.name || '-'} · {formatShortDate(txn.date)}</span>
                                    </div>
                                    <span className={`txn-item__amount ${txn.type === 'income' ? 'text-income' : 'text-expense'}`}>
                                        {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                                    </span>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
