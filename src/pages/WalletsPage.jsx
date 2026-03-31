import { useState } from 'react';
import { Plus, ArrowRightLeft, Pencil, Trash2, Wallet, Building, Smartphone, CreditCard, PiggyBank, Banknote, ScrollText } from 'lucide-react';
import useWalletStore from '../stores/walletStore';
import useSettingsStore from '../stores/settingsStore';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CurrencyInput from '../components/ui/CurrencyInput';
import PageHeader from '../components/layout/PageHeader';
import './WalletsPage.css';

const COLOR_OPTIONS = [
    '#3b987b', '#22c55e', '#0ea5e9', '#98503b', '#98873b',
    '#2d7660', '#5fb89a', '#8b5cf6', '#ef4444', '#f97316',
    '#e84393', '#00cec9', '#d63031', '#a29bfe', '#636e72',
];

const formatDateInput = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getCurrentMonthRange = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        from: formatDateInput(from),
        to: formatDateInput(to),
    };
};

const getMutationFlags = (type) => {
    const isTransferIn = type === 'transfer_in' || type === 'transferIn';
    const isTransferOut = type === 'transfer_out' || type === 'transferOut';
    const isAdjustmentIn = type === 'adjust_in' || type === 'adjustIn';
    const isAdjustmentOut = type === 'adjust_out' || type === 'adjustOut';
    const isIncome = type === 'income' || isTransferIn || isAdjustmentIn;
    const isTransfer = isTransferIn || isTransferOut;
    const isAdjustment = isAdjustmentIn || isAdjustmentOut;

    return {
        isTransferIn,
        isTransferOut,
        isAdjustmentIn,
        isAdjustmentOut,
        isIncome,
        isTransfer,
        isAdjustment,
    };
};

export default function WalletsPage() {
    const { wallets, addWallet, updateWallet, deleteWallet, adjustBalance, transfer, fetchMutations, getTotalBalance } = useWalletStore();
    const { currency } = useSettingsStore();

    const [showForm, setShowForm] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [editingWallet, setEditingWallet] = useState(null);
    const [deletingWallet, setDeletingWallet] = useState(null);
    const [adjustWallet, setAdjustWallet] = useState(null);
    const [showMutations, setShowMutations] = useState(false);
    const [mutationsWallet, setMutationsWallet] = useState(null);
    const [mutations, setMutations] = useState([]);
    const [loadingMutations, setLoadingMutations] = useState(false);
    const [mutationDateFrom, setMutationDateFrom] = useState(getCurrentMonthRange().from);
    const [mutationDateTo, setMutationDateTo] = useState(getCurrentMonthRange().to);
    const [mutationTypeFilter, setMutationTypeFilter] = useState('all');

    // Form
    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
    const [formBalance, setFormBalance] = useState('');

    // Transfer
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');

    // Adjust
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustType, setAdjustType] = useState('add');
    const [adjustDescription, setAdjustDescription] = useState('');

    const totalBalance = getTotalBalance();

    const resetForm = () => {
        setFormName('');
        setFormColor(COLOR_OPTIONS[0]);
        setFormBalance('');
        setEditingWallet(null);
    };

    const openEdit = (w) => {
        setEditingWallet(w);
        setFormName(w.name);
        setFormColor(w.color);
        setFormBalance(w.balance.toString());
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formName.trim()) return;

        if (editingWallet) {
            updateWallet(editingWallet.id, {
                name: formName,
                color: formColor,
                balance: parseFloat(formBalance) || 0,
            });
        } else {
            addWallet({
                name: formName,
                color: formColor,
                balance: parseFloat(formBalance) || 0,
            });
        }
        setShowForm(false);
        resetForm();
    };

    const handleTransfer = (e) => {
        e.preventDefault();
        if (!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo) return;
        transfer(parseInt(transferFrom), parseInt(transferTo), parseFloat(transferAmount));
        setShowTransfer(false);
        setTransferFrom('');
        setTransferTo('');
        setTransferAmount('');
    };

    const handleAdjust = (e) => {
        e.preventDefault();
        if (!adjustAmount || !adjustWallet) return;
        const amount = parseFloat(adjustAmount);
        adjustBalance(adjustWallet.id, amount, adjustType, adjustDescription.trim());
        setShowAdjust(false);
        setAdjustWallet(null);
        setAdjustAmount('');
        setAdjustDescription('');
    };

    const handleDelete = () => {
        if (deletingWallet) {
            deleteWallet(deletingWallet.id);
            setDeletingWallet(null);
        }
    };

    const resetMutationFilters = () => {
        const monthRange = getCurrentMonthRange();
        setMutationDateFrom(monthRange.from);
        setMutationDateTo(monthRange.to);
        setMutationTypeFilter('all');
    };

    const openMutations = async (w) => {
        setMutationsWallet(w);
        resetMutationFilters();
        setShowMutations(true);
        setLoadingMutations(true);
        try {
            const data = await fetchMutations(w.id);
            setMutations(data);
        } catch {
            setMutations([]);
        } finally {
            setLoadingMutations(false);
        }
    };

    const filteredMutations = mutations.filter((m) => {
        if (mutationDateFrom && m.date < mutationDateFrom) return false;
        if (mutationDateTo && m.date > mutationDateTo) return false;

        if (mutationTypeFilter === 'all') return true;

        const flags = getMutationFlags(m.type);

        if (mutationTypeFilter === 'income') return m.type === 'income';
        if (mutationTypeFilter === 'expense') return m.type === 'expense';
        if (mutationTypeFilter === 'transfer') return flags.isTransfer;
        if (mutationTypeFilter === 'adjustment') return flags.isAdjustment;

        return true;
    });

    return (
        <div className="page-container">
            <PageHeader title="Kantong" />

            {/* Total Balance */}
            <Card glow className="wallet-total animate-scale-in">
                <span className="wallet-total__label">Total Saldo</span>
                <span className={`wallet-total__amount ${totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(totalBalance, currency)}
                </span>
                <span className="wallet-total__count">{wallets.length} kantong</span>
            </Card>

            {/* Actions */}
            <div className="grid-2 mt-md mb-lg">
                <Button fullWidth onClick={() => { resetForm(); setShowForm(true); }} icon={<Plus size={16} />}>
                    Tambah
                </Button>
                <Button variant="secondary" fullWidth onClick={() => setShowTransfer(true)} icon={<ArrowRightLeft size={16} />}>
                    Transfer
                </Button>
            </div>

            {/* Wallet Cards */}
            <div className="stagger-children">
                {wallets.map((w) => (
                    <Card key={w.id} className="wallet-card mb-sm">
                        <div className="wallet-card__left">
                            <div className="wallet-card__icon" style={{ background: w.color + '20', color: w.color }}>
                                {w.name.charAt(0)}
                            </div>
                            <div>
                                <span className="wallet-card__name">{w.name}</span>
                                <span className={`wallet-card__balance ${w.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                                    {formatCurrency(w.balance, currency)}
                                </span>
                            </div>
                        </div>
                        <div className="wallet-card__actions">
                            <button
                                className="txn-action-btn"
                                onClick={() => openMutations(w)}
                                title="Lihat mutasi"
                            >
                                <ScrollText size={14} />
                            </button>
                            <button
                                className="txn-action-btn"
                                onClick={() => { setAdjustWallet(w); setAdjustType('add'); setAdjustAmount(''); setAdjustDescription(''); setShowAdjust(true); }}
                                title="Sesuaikan saldo"
                            >
                                <Banknote size={14} />
                            </button>
                            <button className="txn-action-btn" onClick={() => openEdit(w)}>
                                <Pencil size={14} />
                            </button>
                            <button className="txn-action-btn txn-action-btn--danger" onClick={() => setDeletingWallet(w)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add/Edit Wallet Modal */}
            <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingWallet ? 'Edit Kantong' : 'Kantong Baru'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nama Kantong</label>
                        <input type="text" placeholder="Contoh: Tabungan" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Saldo Awal</label>
                        <CurrencyInput placeholder="0" value={formBalance} onChange={(val) => setFormBalance(val)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Warna</label>
                        <div className="color-picker">
                            {COLOR_OPTIONS.map((c) => (
                                <button key={c} type="button" className={`color-picker__item ${formColor === c ? 'color-picker__item--active' : ''}`} style={{ background: c }} onClick={() => setFormColor(c)} />
                            ))}
                        </div>
                    </div>
                    <Button type="submit" fullWidth className="mt-md">
                        {editingWallet ? 'Simpan' : 'Tambah'}
                    </Button>
                </form>
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Transfer Antar Kantong">
                <form onSubmit={handleTransfer}>
                    <div className="form-group">
                        <label className="form-label">Dari</label>
                        <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} required>
                            <option value="">Pilih kantong asal</option>
                            {wallets.map((w) => (
                                <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance, currency)})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Ke</label>
                        <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} required>
                            <option value="">Pilih kantong tujuan</option>
                            {wallets.filter((w) => String(w.id) !== transferFrom).map((w) => (
                                <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance, currency)})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jumlah</label>
                        <CurrencyInput placeholder="0" value={transferAmount} onChange={(val) => setTransferAmount(val)} required />
                    </div>
                    <Button type="submit" fullWidth className="mt-md">Transfer</Button>
                </form>
            </Modal>

            {/* Adjust Balance Modal */}
            <Modal isOpen={showAdjust} onClose={() => { setShowAdjust(false); setAdjustWallet(null); setAdjustDescription(''); }} title={`Sesuaikan Saldo - ${adjustWallet?.name || ''}`}>
                <form onSubmit={handleAdjust}>
                    <div className="type-toggle mb-md">
                        <button type="button" className={`type-toggle__btn ${adjustType === 'add' ? 'type-toggle__btn--active-income' : ''}`} onClick={() => setAdjustType('add')}>
                            Tambah
                        </button>
                        <button type="button" className={`type-toggle__btn ${adjustType === 'subtract' ? 'type-toggle__btn--active-expense' : ''}`} onClick={() => setAdjustType('subtract')}>
                            Kurangi
                        </button>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jumlah</label>
                        <CurrencyInput placeholder="0" value={adjustAmount} onChange={(val) => setAdjustAmount(val)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <textarea
                            rows={3}
                            placeholder="Contoh: Koreksi saldo setelah cek rekening"
                            value={adjustDescription}
                            onChange={(e) => setAdjustDescription(e.target.value)}
                            maxLength={500}
                            required
                        />
                    </div>
                    <Button type="submit" fullWidth className="mt-md">Sesuaikan</Button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deletingWallet}
                onClose={() => setDeletingWallet(null)}
                onConfirm={handleDelete}
                title="Hapus Kantong?"
                message={`Kantong "${deletingWallet?.name}" akan dihapus permanen. Saldo di dalamnya juga akan hilang.`}
            />

            {/* Mutations Modal */}
            <Modal isOpen={showMutations} onClose={() => { setShowMutations(false); setMutationsWallet(null); setMutations([]); resetMutationFilters(); }} title={`Mutasi - ${mutationsWallet?.name || ''}`}>
                {loadingMutations ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat...</div>
                ) : (
                    <>
                        <div className="form-row mb-md">
                            <div className="form-group">
                                <label className="form-label">Dari Tanggal</label>
                                <input type="date" value={mutationDateFrom} onChange={(e) => setMutationDateFrom(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sampai Tanggal</label>
                                <input type="date" value={mutationDateTo} onChange={(e) => setMutationDateTo(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group mb-md">
                            <label className="form-label">Jenis</label>
                            <select value={mutationTypeFilter} onChange={(e) => setMutationTypeFilter(e.target.value)}>
                                <option value="all">Semua</option>
                                <option value="income">Pemasukan</option>
                                <option value="expense">Pengeluaran</option>
                                <option value="transfer">Transfer</option>
                                <option value="adjustment">Penyesuaian</option>
                            </select>
                        </div>
                    </>
                )}
                {!loadingMutations && (
                    filteredMutations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada mutasi</div>
                    ) : (
                        <div className="mutations-list">
                            {filteredMutations.map((m, i) => {
                                const { isTransferIn, isAdjustmentIn, isIncome, isTransfer, isAdjustment } = getMutationFlags(m.type);
                                return (
                                    <div key={`${m.type}-${m.id}-${i}`} className="mutation-item">
                                        <div className="mutation-item__info">
                                            <span className="mutation-item__desc">{m.description}</span>
                                            <span className="mutation-item__meta">
                                                {isTransfer
                                                    ? (isTransferIn ? 'Transfer Masuk' : 'Transfer Keluar')
                                                    : isAdjustment
                                                        ? (isAdjustmentIn ? 'Penyesuaian Tambah' : 'Penyesuaian Kurang')
                                                        : (m.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                                                {' - '}{formatShortDate(m.date)}
                                            </span>
                                        </div>
                                        <span className={`mutation-item__amount ${isIncome ? 'text-income' : 'text-expense'}`}>
                                            {isIncome ? '+' : '-'}{formatCurrency(m.amount, currency)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </Modal>
        </div>
    );
}

