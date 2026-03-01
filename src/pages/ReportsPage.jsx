import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { Wallet, HandCoins, CalendarCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import useTransactionStore from '../stores/transactionStore';
import useCategoryStore from '../stores/categoryStore';
import useSettingsStore from '../stores/settingsStore';
import useDebtStore from '../stores/debtStore';
import useWalletStore from '../stores/walletStore';
import useObligationStore from '../stores/obligationStore';
import { formatCurrency } from '../utils/formatters';
import { MONTHS, CHART_COLORS } from '../utils/constants';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/layout/PageHeader';
import { TrendingUp, TrendingDown, CalendarCheck as CalendarCheckIcon } from 'lucide-react';
import './ReportsPage.css';

export default function ReportsPage() {
    const { transactions, getMonthlyData, getCategoryBreakdown } = useTransactionStore();
    const { categories, getCategoryById } = useCategoryStore();
    const { currency } = useSettingsStore();
    const { debts, getTotalOwed, getTotalLent } = useDebtStore();
    const { wallets, getTotalBalance } = useWalletStore();
    const { obligations, getActiveCount, getTotalMonthlyAmount, getPeriodsForObligation, isPeriodPaid } = useObligationStore();

    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [reportType, setReportType] = useState('expense');

    // Trend filters
    const [trendIncomeCategory, setTrendIncomeCategory] = useState('');
    const [trendExpenseCategory, setTrendExpenseCategory] = useState('');
    const [trendObligationId, setTrendObligationId] = useState('');

    // Monthly bar data
    const monthlyData = useMemo(() => {
        return getMonthlyData(selectedYear).map((d) => ({
            name: MONTHS[d.month].slice(0, 3),
            Pemasukan: d.income,
            Pengeluaran: d.expense,
        }));
    }, [transactions, selectedYear]);

    // Category breakdown for pie
    const categoryData = useMemo(() => {
        const breakdown = getCategoryBreakdown(reportType, selectedMonth, selectedYear);
        return breakdown.map((item, i) => {
            const cat = getCategoryById(item.categoryId);
            return {
                name: cat?.name || 'Lainnya',
                value: item.amount,
                color: cat?.color || CHART_COLORS[i % CHART_COLORS.length],
            };
        });
    }, [transactions, reportType, selectedMonth, selectedYear]);

    const totalAmount = categoryData.reduce((s, d) => s + d.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="chart-tooltip">
                <p className="chart-tooltip__value" style={{ color: payload[0].payload?.color || payload[0].color }}>
                    {payload[0].name}: {formatCurrency(payload[0].value, currency)}
                </p>
            </div>
        );
    };

    const BarTooltip = ({ active, payload, label }) => {
        if (!active || !payload) return null;
        return (
            <div className="chart-tooltip">
                <p className="chart-tooltip__label">{label}</p>
                {payload.map((p) => (
                    <p key={p.name} style={{ color: p.fill }} className="chart-tooltip__value">
                        {p.name}: {formatCurrency(p.value, currency)}
                    </p>
                ))}
            </div>
        );
    };

    const hasTransactions = transactions.length > 0;

    // Helper: compute daily trend data for a type+category in a specific month/year
    const getDailyTrend = (type, categoryId) => {
        if (!categoryId) return [];
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const daily = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const total = transactions
                .filter((t) => {
                    return t.type === type && t.categoryId === parseInt(categoryId) && t.date === dateStr;
                })
                .reduce((s, t) => s + t.amount, 0);
            daily.push({ day: d, amount: total });
        }
        return daily;
    };

    // Trend data
    const incomeTrendData = useMemo(() => getDailyTrend('income', trendIncomeCategory), [transactions, selectedMonth, selectedYear, trendIncomeCategory]);
    const expenseTrendData = useMemo(() => getDailyTrend('expense', trendExpenseCategory), [transactions, selectedMonth, selectedYear, trendExpenseCategory]);

    // Total untuk trend
    const incomeTrendTotal = incomeTrendData.reduce((s, d) => s + d.amount, 0);
    const expenseTrendTotal = expenseTrendData.reduce((s, d) => s + d.amount, 0);

    // Categories filtered by type
    const incomeCategories = useMemo(() => categories.filter((c) => c.type === 'income'), [categories]);
    const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories]);

    return (
        <div className="page-container">
            <PageHeader title="Laporan" subtitle="Analisis keuangan kamu" />

            {hasTransactions && (<>
                {/* Year Selector */}
                <div className="month-selector mb-lg">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                        {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Bar Chart — Monthly Trend */}
                <div className="mb-lg">
                    <h2 className="section-title">Tren Bulanan {selectedYear}</h2>
                    <Card className="chart-card">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={monthlyData} barGap={2}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8a9290', fontSize: 10 }}
                                />
                                <YAxis hide />
                                <Tooltip content={<BarTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: 11, color: '#8a9290' }}
                                    iconType="circle"
                                    iconSize={8}
                                />
                                <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Pengeluaran" fill="#98503b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Pie Chart — Category Breakdown */}
                <div className="mb-lg">
                    <h2 className="section-title">{reportType === 'expense' ? 'Pengeluaran' : 'Pemasukan'} per Kategori</h2>

                    <div className="type-toggle mb-md">
                        <button
                            className={`type-toggle__btn ${reportType === 'expense' ? 'type-toggle__btn--active-expense' : ''}`}
                            onClick={() => setReportType('expense')}
                        >
                            Pengeluaran
                        </button>
                        <button
                            className={`type-toggle__btn ${reportType === 'income' ? 'type-toggle__btn--active-income' : ''}`}
                            onClick={() => setReportType('income')}
                        >
                            Pemasukan
                        </button>
                    </div>

                    {categoryData.length === 0 ? (
                        <Card>
                            <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                                Tidak ada data untuk periode ini
                            </p>
                        </Card>
                    ) : (
                        <>
                            <Card className="chart-card">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {categoryData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pie-center">
                                    <span className="pie-center__label">Total</span>
                                    <span className="pie-center__value">{formatCurrency(totalAmount, currency)}</span>
                                </div>
                            </Card>

                            {/* Legend */}
                            <div className="pie-legend mt-md stagger-children">
                                {categoryData.map((item, i) => (
                                    <div key={i} className="pie-legend__item">
                                        <div className="pie-legend__color" style={{ background: item.color }} />
                                        <span className="pie-legend__name">{item.name}</span>
                                        <span className="pie-legend__value">{formatCurrency(item.value, currency)}</span>
                                        <span className="pie-legend__pct">
                                            {totalAmount > 0 ? Math.round((item.value / totalAmount) * 100) : 0}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Trend Pemasukan */}
                <div className="mb-lg">
                    <h2 className="section-title"><TrendingUp size={16} /> Trend Pemasukan</h2>
                    <div className="month-selector mb-sm">
                        <select value={trendIncomeCategory} onChange={(e) => setTrendIncomeCategory(e.target.value)}>
                            <option value="">Pilih Kategori Pemasukan</option>
                            {incomeCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    {!trendIncomeCategory ? (
                        <Card>
                            <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                                Pilih kategori untuk melihat trend pemasukan
                            </p>
                        </Card>
                    ) : incomeTrendTotal === 0 ? (
                        <Card>
                            <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                                Tidak ada data pemasukan untuk kategori ini
                            </p>
                        </Card>
                    ) : (
                        <Card className="chart-card">
                            <p className="chart-card__total text-income">Total: {formatCurrency(incomeTrendTotal, currency)}</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={incomeTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8a9290', fontSize: 10 }} />
                                    <YAxis hide />
                                    <Tooltip content={<BarTooltip />} />
                                    <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} dot={false} name="Pemasukan" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    )}
                </div>

                {/* Trend Pengeluaran */}
                <div className="mb-lg">
                    <h2 className="section-title"><TrendingDown size={16} /> Trend Pengeluaran</h2>
                    <div className="month-selector mb-sm">
                        <select value={trendExpenseCategory} onChange={(e) => setTrendExpenseCategory(e.target.value)}>
                            <option value="">Pilih Kategori Pengeluaran</option>
                            {expenseCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    {!trendExpenseCategory ? (
                        <Card>
                            <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                                Pilih kategori untuk melihat trend pengeluaran
                            </p>
                        </Card>
                    ) : expenseTrendTotal === 0 ? (
                        <Card>
                            <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                                Tidak ada data pengeluaran untuk kategori ini
                            </p>
                        </Card>
                    ) : (
                        <Card className="chart-card">
                            <p className="chart-card__total text-expense">Total: {formatCurrency(expenseTrendTotal, currency)}</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={expenseTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8a9290', fontSize: 10 }} />
                                    <YAxis hide />
                                    <Tooltip content={<BarTooltip />} />
                                    <Line type="monotone" dataKey="amount" stroke="#98503b" strokeWidth={2} dot={false} name="Pengeluaran" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    )}
                </div>

                {/* Trend Tanggungan */}
                <div className="mb-lg">
                    <h2 className="section-title"><CalendarCheckIcon size={16} /> Trend Tanggungan</h2>
                    <div className="month-selector mb-sm">
                        <select value={trendObligationId} onChange={(e) => setTrendObligationId(e.target.value)}>
                            <option value="">Pilih Tanggungan</option>
                            {obligations.map((o) => (
                                <option key={o.id} value={o.id}>{o.name} — {formatCurrency(o.amount, currency)}/{o.type === 'monthly' ? 'bulan' : 'tahun'}</option>
                            ))}
                        </select>
                    </div>
                    {!trendObligationId ? (
                        <Card>
                            <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                                Pilih tanggungan untuk melihat riwayat pembayaran
                            </p>
                        </Card>
                    ) : (() => {
                        const obl = obligations.find((o) => String(o.id) === trendObligationId);
                        if (!obl) return null;
                        const periods = getPeriodsForObligation(obl);
                        const data = periods.map((p) => ({
                            name: p.label.length > 8 ? p.label.slice(0, 8) : p.label,
                            status: isPeriodPaid(obl.id, p.key) ? 1 : 0,
                        }));
                        const paidCount = data.filter((d) => d.status === 1).length;
                        return (
                            <Card className="chart-card">
                                <p className="chart-card__total">
                                    <span className="text-income">{paidCount} terbayar</span>
                                    <span className="text-muted"> / {data.length} periode</span>
                                </p>
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={data.slice(-12)}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8a9290', fontSize: 9 }} />
                                        <YAxis hide />
                                        <Bar dataKey="status" radius={[4, 4, 0, 0]}>
                                            {data.slice(-12).map((entry, i) => (
                                                <Cell key={i} fill={entry.status ? '#22c55e' : 'rgba(255,255,255,0.1)'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        );
                    })()}
                </div>
            </>)}

            {/* Kantong Summary */}
            <div className="mb-lg">
                <h2 className="section-title"><Wallet size={16} /> Kantong</h2>
                <Card className="report-summary-card">
                    <div className="report-summary-card__header">
                        <span className="report-summary-card__label">Total Saldo</span>
                        <span className="report-summary-card__value text-income">{formatCurrency(getTotalBalance(), currency)}</span>
                    </div>
                    <div className="report-summary-card__list">
                        {wallets.map((w) => (
                            <div key={w.id} className="report-summary-card__row">
                                <div className="report-summary-card__dot" style={{ background: w.color }} />
                                <span className="report-summary-card__name">{w.name}</span>
                                <span className="report-summary-card__amount">{formatCurrency(w.balance, currency)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Hutang & Piutang */}
            <div className="mb-lg">
                <h2 className="section-title"><HandCoins size={16} /> Hutang & Piutang</h2>
                <div className="report-grid">
                    <Card className="report-summary-card">
                        <div className="report-summary-card__icon-row">
                            <div className="report-summary-card__icon report-summary-card__icon--expense"><ArrowUpRight size={16} /></div>
                            <div>
                                <span className="report-summary-card__label">Hutang Saya</span>
                                <span className="report-summary-card__value text-expense">{formatCurrency(getTotalOwed(), currency)}</span>
                            </div>
                        </div>
                        <span className="report-summary-card__count">{debts.filter(d => d.type === 'i_owe' && d.status === 'active').length} aktif</span>
                    </Card>
                    <Card className="report-summary-card">
                        <div className="report-summary-card__icon-row">
                            <div className="report-summary-card__icon report-summary-card__icon--income"><ArrowDownRight size={16} /></div>
                            <div>
                                <span className="report-summary-card__label">Piutang</span>
                                <span className="report-summary-card__value text-income">{formatCurrency(getTotalLent(), currency)}</span>
                            </div>
                        </div>
                        <span className="report-summary-card__count">{debts.filter(d => d.type === 'they_owe' && d.status === 'active').length} aktif</span>
                    </Card>
                </div>
            </div>

            {/* Tanggungan */}
            <div className="mb-lg">
                <h2 className="section-title"><CalendarCheck size={16} /> Tanggungan</h2>
                <Card className="report-summary-card">
                    <div className="report-summary-card__header">
                        <span className="report-summary-card__label">Est. Pengeluaran / Bulan</span>
                        <span className="report-summary-card__value text-expense">{formatCurrency(getTotalMonthlyAmount(), currency)}</span>
                    </div>
                    <span className="report-summary-card__count">{getActiveCount()} tanggungan aktif</span>
                    {obligations.length > 0 && (
                        <div className="report-summary-card__list mt-sm">
                            {obligations.slice(0, 5).map((o) => {
                                const totalPeriods = o.checklist ? o.checklist.length : 0;
                                return (
                                    <div key={o.id} className="report-summary-card__row">
                                        <span className="report-summary-card__name">{o.name}</span>
                                        <span className="report-summary-card__badge">{o.type === 'monthly' ? 'Bulanan' : 'Tahunan'}</span>
                                        <span className="report-summary-card__amount">{formatCurrency(o.amount, currency)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
