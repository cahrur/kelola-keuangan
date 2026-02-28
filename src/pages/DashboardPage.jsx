import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useTransactionStore from '../stores/transactionStore';
import useCategoryStore from '../stores/categoryStore';
import useSettingsStore from '../stores/settingsStore';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import { MONTHS } from '../utils/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import './DashboardPage.css';

export default function DashboardPage({ onAddTransaction }) {
    const navigate = useNavigate();
    const { transactions, getTotalByType, getMonthlyData } = useTransactionStore();
    const { getCategoryById } = useCategoryStore();
    const { currency } = useSettingsStore();

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const income = getTotalByType('income', month, year);
    const expense = getTotalByType('expense', month, year);
    const balance = income - expense;

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

    const aiSuggestions = useMemo(() => {
        const tips = [];
        if (transactions.length === 0) {
            tips.push('Mulai catat pengeluaran harianmu untuk insight keuangan yang lebih baik.');
            tips.push('Tambahkan pemasukan dan pengeluaran agar AI bisa memberikan analisis.');
        } else {
            if (expense > income && income > 0) {
                tips.push(`Pengeluaranmu ${formatCurrency(expense - income, currency)} lebih besar dari pemasukan. Coba kurangi belanja non-esensial.`);
            } else if (income > 0 && expense / income < 0.5) {
                tips.push(`Bagus! Kamu hemat ${Math.round((1 - expense / income) * 100)}% dari pemasukan. Pertimbangkan untuk investasi.`);
            }
            if (expense > 0) {
                tips.push('Cek halaman Anggaran untuk memastikan pengeluaranmu terkontrol.');
            }
            if (transactions.length > 3) {
                tips.push('Lihat Laporan untuk analisis tren keuanganmu secara mendalam.');
            }
        }
        return tips.slice(0, 2);
    }, [transactions, income, expense, currency]);

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
            <div className="page-header">
                <p className="dashboard__greeting">
                    {MONTHS[month]} {year}
                </p>
                <h1 className="page-title">Dashboard</h1>
            </div>

            {/* AI Suggestions */}
            <div className="ai-suggest animate-slide-up">
                <div className="ai-suggest__header">
                    <Sparkles size={14} />
                    <span>AI Insight</span>
                </div>
                <div className="ai-suggest__tips">
                    {aiSuggestions.map((tip, i) => (
                        <p key={i} className="ai-suggest__tip">{tip}</p>
                    ))}
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
