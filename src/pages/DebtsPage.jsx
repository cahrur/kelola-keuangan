import { useState, useMemo } from 'react';
import { Plus, CheckCircle, Clock, ArrowDownLeft, ArrowUpRight, Trash2, Banknote } from 'lucide-react';
import useDebtStore from '../stores/debtStore';
import useSettingsStore from '../stores/settingsStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import CurrencyInput from '../components/ui/CurrencyInput';
import PageHeader from '../components/layout/PageHeader';
import './DebtsPage.css';

export default function DebtsPage() {
    const { debts, addDebt, updateDebt, deleteDebt, markAsPaid, getTotalOwed, getTotalLent, getRemaining, getPaid } = useDebtStore();
    const { currency } = useSettingsStore();

    const [showForm, setShowForm] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [deletingDebt, setDeletingDebt] = useState(null);
    const [tab, setTab] = useState('i_owe');

    // Form state
    const [formType, setFormType] = useState('i_owe');
    const [formPerson, setFormPerson] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
    const [formDueDate, setFormDueDate] = useState('');

    // Payment form
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

    const totalOwed = getTotalOwed();
    const totalLent = getTotalLent();

    const filteredDebts = useMemo(() => {
        return debts.filter((d) => d.type === tab);
    }, [debts, tab]);

    const activeDebts = filteredDebts.filter((d) => d.status === 'active');
    const paidDebts = filteredDebts.filter((d) => d.status === 'paid');

    const resetForm = () => {
        setFormType('i_owe');
        setFormPerson('');
        setFormAmount('');
        setFormDesc('');
        setFormDate(new Date().toISOString().slice(0, 10));
        setFormDueDate('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formPerson || !formAmount) return;

        addDebt({
            type: formType,
            person: formPerson,
            amount: parseFloat(formAmount),
            description: formDesc,
            date: formDate,
            dueDate: formDueDate || null,
        });

        setShowForm(false);
        resetForm();
    };

    const handlePayment = (e) => {
        e.preventDefault();
        if (!paymentAmount || !selectedDebt) return;
        const newPaid = (selectedDebt.paidAmount || 0) + parseFloat(paymentAmount);
        const isFullyPaid = newPaid >= selectedDebt.amount;
        updateDebt(selectedDebt.id, {
            paidAmount: newPaid,
            status: isFullyPaid ? 'paid' : 'active',
        });
        setShowPayment(false);
        setSelectedDebt(null);
        setPaymentAmount('');
    };

    const handleDelete = () => {
        if (deletingDebt) {
            deleteDebt(deletingDebt.id);
            setDeletingDebt(null);
        }
    };

    const openPayment = (debt) => {
        setSelectedDebt(debt);
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setShowPayment(true);
    };

    const renderDebtCard = (debt) => {
        const remaining = getRemaining(debt.id);
        const paid = getPaid(debt.id);
        const percentage = debt.amount > 0 ? (paid / debt.amount) * 100 : 0;
        const isPaid = debt.status === 'paid';
        const isOverdue = !isPaid && debt.dueDate && new Date(debt.dueDate) < new Date();

        return (
            <Card key={debt.id} className={`debt-card mb-sm ${isPaid ? 'debt-card--paid' : ''}`}>
                <div className="debt-card__header">
                    <div className="debt-card__person">
                        <div className={`debt-card__avatar ${debt.type === 'i_owe' ? 'debt-card__avatar--owe' : 'debt-card__avatar--lent'}`}>
                            {debt.person.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="debt-card__name">{debt.person}</span>
                            <span className="debt-card__date">{formatDate(debt.date)}</span>
                        </div>
                    </div>
                    <div className="debt-card__status-area">
                        {isPaid ? (
                            <span className="budget-badge budget-badge--safe"><CheckCircle size={12} /> Lunas</span>
                        ) : isOverdue ? (
                            <span className="budget-badge budget-badge--danger"><Clock size={12} /> Terlambat</span>
                        ) : (
                            <span className="budget-badge budget-badge--warning"><Clock size={12} /> Aktif</span>
                        )}
                    </div>
                </div>

                {debt.description && (
                    <p className="debt-card__desc">{debt.description}</p>
                )}

                <div className="debt-card__amounts">
                    <div>
                        <span className="debt-card__label">Total</span>
                        <span className="debt-card__value">{formatCurrency(debt.amount, currency)}</span>
                    </div>
                    <div>
                        <span className="debt-card__label">Dibayar</span>
                        <span className="debt-card__value text-income">{formatCurrency(paid, currency)}</span>
                    </div>
                    <div>
                        <span className="debt-card__label">Sisa</span>
                        <span className={`debt-card__value ${remaining > 0 ? 'text-expense' : 'text-income'}`}>
                            {formatCurrency(remaining, currency)}
                        </span>
                    </div>
                </div>

                <div className="budget-progress__bar">
                    <div
                        className={`budget-progress__fill ${isPaid ? '' : percentage > 80 ? '' : 'budget-progress__fill--warning'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>

                {debt.dueDate && (
                    <p className={`debt-card__due ${isOverdue ? 'text-expense' : 'text-muted'}`}>
                        Jatuh tempo: {formatDate(debt.dueDate)}
                    </p>
                )}



                <div className="debt-card__actions">
                    {!isPaid && (
                        <>
                            <Button size="sm" variant="income" onClick={() => openPayment(debt)} icon={<Banknote size={14} />}>
                                Bayar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => markAsPaid(debt.id)} icon={<CheckCircle size={14} />}>
                                Lunas
                            </Button>
                        </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDeletingDebt(debt)} icon={<Trash2 size={14} />} className="debt-delete-btn">
                        Hapus
                    </Button>
                </div>
            </Card>
        );
    };

    return (
        <div className="page-container">
            <PageHeader title="Hutang" />

            {/* Summary */}
            <div className="grid-2 mb-md">
                <Card className="debt-summary animate-scale-in">
                    <div className="debt-summary__icon debt-summary__icon--owe">
                        <ArrowUpRight size={16} />
                    </div>
                    <span className="debt-summary__label">Saya Berhutang</span>
                    <span className="debt-summary__amount text-expense">{formatCurrency(totalOwed, currency)}</span>
                </Card>
                <Card className="debt-summary animate-scale-in" style={{ animationDelay: '0.05s' }}>
                    <div className="debt-summary__icon debt-summary__icon--lent">
                        <ArrowDownLeft size={16} />
                    </div>
                    <span className="debt-summary__label">Piutang Saya</span>
                    <span className="debt-summary__amount text-income">{formatCurrency(totalLent, currency)}</span>
                </Card>
            </div>

            <Button fullWidth className="mb-lg" onClick={() => { resetForm(); setShowForm(true); }} icon={<Plus size={18} />}>
                Tambah Hutang/Piutang
            </Button>

            {/* Tabs */}
            <div className="type-toggle mb-md">
                <button
                    className={`type-toggle__btn ${tab === 'i_owe' ? 'type-toggle__btn--active-expense' : ''}`}
                    onClick={() => setTab('i_owe')}
                >
                    Saya Hutang ({debts.filter(d => d.type === 'i_owe' && d.status === 'active').length})
                </button>
                <button
                    className={`type-toggle__btn ${tab === 'they_owe' ? 'type-toggle__btn--active-income' : ''}`}
                    onClick={() => setTab('they_owe')}
                >
                    Piutang ({debts.filter(d => d.type === 'they_owe' && d.status === 'active').length})
                </button>
            </div>

            {/* Debt List */}
            {filteredDebts.length === 0 ? (
                <EmptyState
                    icon={<CheckCircle size={48} />}
                    title={tab === 'i_owe' ? 'Tidak ada hutang' : 'Tidak ada piutang'}
                    description={tab === 'i_owe' ? 'Kamu bersih dari hutang 🎉' : 'Tidak ada yang berhutang ke kamu'}
                />
            ) : (
                <>
                    {activeDebts.length > 0 && (
                        <div className="mb-lg">
                            <h2 className="section-title">Aktif ({activeDebts.length})</h2>
                            <div className="stagger-children">
                                {activeDebts.map(renderDebtCard)}
                            </div>
                        </div>
                    )}
                    {paidDebts.length > 0 && (
                        <div className="mb-lg">
                            <h2 className="section-title">Lunas ({paidDebts.length})</h2>
                            <div className="stagger-children">
                                {paidDebts.map(renderDebtCard)}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add Debt Modal */}
            <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title="Hutang/Piutang Baru">
                <form onSubmit={handleSubmit}>
                    <div className="type-toggle mb-md">
                        <button type="button" className={`type-toggle__btn ${formType === 'i_owe' ? 'type-toggle__btn--active-expense' : ''}`} onClick={() => setFormType('i_owe')}>
                            Saya Berhutang
                        </button>
                        <button type="button" className={`type-toggle__btn ${formType === 'they_owe' ? 'type-toggle__btn--active-income' : ''}`} onClick={() => setFormType('they_owe')}>
                            Orang Berhutang
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{formType === 'i_owe' ? 'Hutang Kepada' : 'Yang Berhutang'}</label>
                        <input type="text" placeholder="Nama orang" value={formPerson} onChange={(e) => setFormPerson(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jumlah</label>
                        <CurrencyInput placeholder="0" value={formAmount} onChange={(val) => setFormAmount(val)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Keterangan (opsional)</label>
                        <input type="text" placeholder="Untuk apa?" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tanggal</label>
                            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jatuh Tempo</label>
                            <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                        </div>
                    </div>

                    <Button type="submit" fullWidth className="mt-md">Tambah</Button>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={showPayment} onClose={() => { setShowPayment(false); setSelectedDebt(null); }} title={`Bayar — ${selectedDebt?.person || ''}`}>
                <form onSubmit={handlePayment}>
                    {selectedDebt && (
                        <p className="text-muted mb-md" style={{ fontSize: 'var(--font-sm)' }}>
                            Sisa: <strong className="text-expense">{formatCurrency(getRemaining(selectedDebt.id), currency)}</strong>
                        </p>
                    )}
                    <div className="form-group">
                        <label className="form-label">Jumlah Bayar</label>
                        <CurrencyInput placeholder="0" value={paymentAmount} onChange={(val) => setPaymentAmount(val)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Bayar</label>
                        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
                    </div>
                    <Button type="submit" fullWidth className="mt-md">Bayar</Button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deletingDebt}
                onClose={() => setDeletingDebt(null)}
                onConfirm={handleDelete}
                title="Hapus Hutang?"
                message={`Hutang dari/ke "${deletingDebt?.person}" akan dihapus permanen beserta riwayat pembayarannya.`}
            />
        </div>
    );
}
