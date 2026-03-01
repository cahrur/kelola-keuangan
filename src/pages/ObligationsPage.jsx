import { useState } from 'react';
import { Plus, Pencil, Trash2, CalendarCheck, CheckCircle, Circle, RefreshCw, Clock } from 'lucide-react';
import useObligationStore from '../stores/obligationStore';
import useTransactionStore from '../stores/transactionStore';
import useSettingsStore from '../stores/settingsStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import CurrencyInput from '../components/ui/CurrencyInput';
import PageHeader from '../components/layout/PageHeader';
import './ObligationsPage.css';

export default function ObligationsPage() {
    const { obligations, addObligation, updateObligation, deleteObligation, togglePeriod, isPeriodPaid, getPeriodsForObligation, getTotalMonthlyAmount } = useObligationStore();
    const { addTransaction } = useTransactionStore();
    const { currency } = useSettingsStore();

    const [showForm, setShowForm] = useState(false);
    const [showChecklist, setShowChecklist] = useState(false);
    const [selectedObligation, setSelectedObligation] = useState(null);
    const [editingObligation, setEditingObligation] = useState(null);
    const [deletingObligation, setDeletingObligation] = useState(null);

    // Form
    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formType, setFormType] = useState('monthly');
    const [formStart, setFormStart] = useState(new Date().toISOString().slice(0, 10));
    const [formEnd, setFormEnd] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formAutoRecord, setFormAutoRecord] = useState(true);

    const totalMonthly = getTotalMonthlyAmount();

    const now = new Date();
    const activeObligations = obligations.filter((o) => !o.endDate || new Date(o.endDate) >= now);
    const expiredObligations = obligations.filter((o) => o.endDate && new Date(o.endDate) < now);

    const resetForm = () => {
        setFormName('');
        setFormDesc('');
        setFormType('monthly');
        setFormStart(new Date().toISOString().slice(0, 10));
        setFormEnd('');
        setFormAmount('');
        setFormAutoRecord(true);
        setEditingObligation(null);
    };

    const openEdit = (o) => {
        setEditingObligation(o);
        setFormName(o.name);
        setFormDesc(o.description);
        setFormType(o.type);
        setFormStart(o.startDate);
        setFormEnd(o.endDate || '');
        setFormAmount(o.amount.toString());
        setFormAutoRecord(o.autoRecord);
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formName || !formAmount || !formStart) return;

        const data = {
            name: formName,
            description: formDesc,
            type: formType,
            startDate: formStart,
            endDate: formEnd || null,
            amount: parseFloat(formAmount),
            autoRecord: formAutoRecord,
        };

        if (editingObligation) {
            updateObligation(editingObligation.id, data);
        } else {
            addObligation(data);
        }
        setShowForm(false);
        resetForm();
    };

    const handleTogglePeriod = (obligation, periodKey) => {
        const wasPaid = isPeriodPaid(obligation.id, periodKey);
        togglePeriod(obligation.id, periodKey);

        // Auto-record: jika dicentang dan autoRecord aktif, tambah transaksi
        if (!wasPaid && obligation.autoRecord) {
            addTransaction({
                type: 'expense',
                amount: obligation.amount,
                description: `${obligation.name} — ${periodKey}`,
                categoryId: '',
                date: new Date().toISOString().slice(0, 10),
            });
        }
    };

    const openChecklist = (o) => {
        setSelectedObligation(o);
        setShowChecklist(true);
    };

    const handleDelete = () => {
        if (deletingObligation) {
            deleteObligation(deletingObligation.id);
            setDeletingObligation(null);
        }
    };

    const getProgress = (obligation) => {
        const periods = getPeriodsForObligation(obligation);
        if (periods.length === 0) return { total: 0, paid: 0, pct: 0 };
        const paid = periods.filter((p) => isPeriodPaid(obligation.id, p.key)).length;
        return { total: periods.length, paid, pct: Math.round((paid / periods.length) * 100) };
    };

    const renderObligationCard = (o) => {
        const progress = getProgress(o);
        const isExpired = o.endDate && new Date(o.endDate) < now;

        return (
            <Card key={o.id} className={`obligation-card mb-sm ${isExpired ? 'obligation-card--expired' : ''}`} onClick={() => openChecklist(o)}>
                <div className="obligation-card__header">
                    <div className="obligation-card__info">
                        <span className="obligation-card__name">{o.name}</span>
                        {o.description && <span className="obligation-card__desc">{o.description}</span>}
                    </div>
                    <div className="obligation-card__actions" onClick={(e) => e.stopPropagation()}>
                        <button className="txn-action-btn" onClick={() => openEdit(o)}>
                            <Pencil size={12} />
                        </button>
                        <button className="txn-action-btn txn-action-btn--danger" onClick={() => setDeletingObligation(o)}>
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>

                <div className="obligation-card__meta">
                    <span className={`obligation-badge ${o.type === 'monthly' ? 'obligation-badge--monthly' : 'obligation-badge--yearly'}`}>
                        <RefreshCw size={10} />
                        {o.type === 'monthly' ? 'Bulanan' : 'Tahunan'}
                    </span>
                    <span className="obligation-card__amount text-expense">
                        {formatCurrency(o.amount, currency)}
                    </span>
                </div>

                <div className="obligation-card__dates">
                    <Clock size={12} />
                    <span>{formatDate(o.startDate)}</span>
                    <span>—</span>
                    <span>{o.endDate ? formatDate(o.endDate) : 'Selamanya'}</span>
                </div>

                <div className="obligation-card__progress">
                    <div className="budget-progress__bar">
                        <div className="budget-progress__fill" style={{ width: `${progress.pct}%` }} />
                    </div>
                    <span className="obligation-card__progress-text">
                        {progress.paid}/{progress.total} terbayar ({progress.pct}%)
                    </span>
                </div>

                {o.autoRecord && (
                    <span className="obligation-auto-badge">
                        <CalendarCheck size={10} /> Catat Otomatis
                    </span>
                )}
            </Card>
        );
    };

    return (
        <div className="page-container">
            <PageHeader title="Tanggungan" subtitle="Kelola tagihan & kewajiban rutin" />

            {/* Summary */}
            <Card glow className="obligation-summary animate-scale-in">
                <span className="obligation-summary__label">Est. Pengeluaran Bulanan</span>
                <span className="obligation-summary__amount text-expense">{formatCurrency(totalMonthly, currency)}</span>
                <span className="obligation-summary__count">{activeObligations.length} tanggungan aktif</span>
            </Card>

            <Button fullWidth className="mt-md mb-lg" onClick={() => { resetForm(); setShowForm(true); }} icon={<Plus size={18} />}>
                Tambah Tanggungan
            </Button>

            {/* Active */}
            {obligations.length === 0 ? (
                <EmptyState
                    icon={<CalendarCheck size={48} />}
                    title="Belum ada tanggungan"
                    description="Tambahkan tagihan rutin seperti listrik, internet, atau sewa"
                />
            ) : (
                <>
                    {activeObligations.length > 0 && (
                        <div className="mb-lg">
                            <h2 className="section-title">Aktif ({activeObligations.length})</h2>
                            <div className="stagger-children">
                                {activeObligations.map(renderObligationCard)}
                            </div>
                        </div>
                    )}
                    {expiredObligations.length > 0 && (
                        <div className="mb-lg">
                            <h2 className="section-title">Selesai ({expiredObligations.length})</h2>
                            <div className="stagger-children">
                                {expiredObligations.map(renderObligationCard)}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingObligation ? 'Edit Tanggungan' : 'Tanggungan Baru'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama</label>
                        <input type="text" placeholder="Contoh: Listrik PLN" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Deskripsi (opsional)</label>
                        <input type="text" placeholder="Detail tambahan" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tipe</label>
                        <div className="type-toggle">
                            <button type="button" className={`type-toggle__btn ${formType === 'monthly' ? 'type-toggle__btn--active-expense' : ''}`} onClick={() => setFormType('monthly')}>
                                Bulanan
                            </button>
                            <button type="button" className={`type-toggle__btn ${formType === 'yearly' ? 'type-toggle__btn--active-expense' : ''}`} onClick={() => setFormType('yearly')}>
                                Tahunan
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nominal</label>
                        <CurrencyInput placeholder="0" value={formAmount} onChange={(val) => setFormAmount(val)} required />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Mulai</label>
                            <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sampai (opsional)</label>
                            <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
                        </div>
                    </div>

                    <label className="obligation-checkbox">
                        <input type="checkbox" checked={formAutoRecord} onChange={(e) => setFormAutoRecord(e.target.checked)} />
                        <CalendarCheck size={16} />
                        <div>
                            <span className="obligation-checkbox__label">Catat Otomatis</span>
                            <span className="obligation-checkbox__desc">Otomatis menambah transaksi pengeluaran saat dicentang</span>
                        </div>
                    </label>

                    <Button type="submit" fullWidth className="mt-md">
                        {editingObligation ? 'Simpan' : 'Tambah'}
                    </Button>
                </form>
            </Modal>

            {/* Checklist Modal */}
            <Modal isOpen={showChecklist} onClose={() => { setShowChecklist(false); setSelectedObligation(null); }} title={selectedObligation?.name || 'Checklist'}>
                {selectedObligation && (
                    <div className="checklist-modal">
                        <div className="checklist-modal__info">
                            <span className="text-expense" style={{ fontWeight: 700 }}>{formatCurrency(selectedObligation.amount, currency)}</span>
                            <span className="text-muted"> / {selectedObligation.type === 'monthly' ? 'bulan' : 'tahun'}</span>
                        </div>
                        {selectedObligation.autoRecord && (
                            <p className="checklist-modal__auto">
                                <CalendarCheck size={14} /> Catat otomatis ke transaksi saat dicentang
                            </p>
                        )}
                        <div className="checklist-list">
                            {getPeriodsForObligation(selectedObligation).reverse().map((period) => {
                                const paid = isPeriodPaid(selectedObligation.id, period.key);
                                return (
                                    <button
                                        key={period.key}
                                        className={`checklist-item ${paid ? 'checklist-item--paid' : ''}`}
                                        onClick={() => handleTogglePeriod(selectedObligation, period.key)}
                                    >
                                        <span className="checklist-item__icon">
                                            {paid ? <CheckCircle size={20} /> : <Circle size={20} />}
                                        </span>
                                        <span className="checklist-item__label">{period.label}</span>
                                        <span className={`checklist-item__status ${paid ? 'text-income' : 'text-muted'}`}>
                                            {paid ? 'Lunas' : 'Belum'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete */}
            <ConfirmDialog
                isOpen={!!deletingObligation}
                onClose={() => setDeletingObligation(null)}
                onConfirm={handleDelete}
                title="Hapus Tanggungan?"
                message={`Tanggungan "${deletingObligation?.name}" akan dihapus beserta riwayat pembayarannya.`}
            />
        </div>
    );
}
