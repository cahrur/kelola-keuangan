import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Pencil, Trash2, X } from 'lucide-react';
import useTransactionStore from '../stores/transactionStore';
import useCategoryStore from '../stores/categoryStore';
import useWalletStore from '../stores/walletStore';
import useSettingsStore from '../stores/settingsStore';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import CurrencyInput from '../components/ui/CurrencyInput';
import PageHeader from '../components/layout/PageHeader';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import { isVoiceInputSupported } from '../utils/platform';
import './TransactionsPage.css';

export default function TransactionsPage() {
    const { transactions, addTransaction, updateTransaction, deleteTransaction, getFilteredTransactions, parseFromText } =
        useTransactionStore();
    const { categories, getCategoryById } = useCategoryStore();
    const { wallets, getWalletById } = useWalletStore();
    const { currency } = useSettingsStore();

    const [showForm, setShowForm] = useState(false);

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [editingTxn, setEditingTxn] = useState(null);
    const [deletingTxn, setDeletingTxn] = useState(null);

    // Form state
    const [formType, setFormType] = useState('expense');
    const [formAmount, setFormAmount] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formWallet, setFormWallet] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

    const filteredTransactions = useMemo(() => {
        const categoryId = filterCategory ? Number(filterCategory) : undefined;
        let results = getFilteredTransactions({
            type: filterType || undefined,
            categoryId,
            search: search || undefined,
        });
        if (filterDateFrom) {
            results = results.filter((t) => t.date >= filterDateFrom);
        }
        if (filterDateTo) {
            results = results.filter((t) => t.date <= filterDateTo);
        }
        return results;
    }, [transactions, filterType, filterCategory, search, filterDateFrom, filterDateTo, getFilteredTransactions]);

    const resetForm = () => {
        setFormType('expense');
        setFormAmount('');
        setFormDesc('');
        setFormCategory('');
        setFormWallet('');
        setFormDate(new Date().toISOString().slice(0, 10));
        setEditingTxn(null);
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const [voiceError, setVoiceError] = useState('');
    const [voiceLoading, setVoiceLoading] = useState(false);

    // Hasil AI sengaja hanya mengisi formulir, tidak langsung menyimpan: salah
    // dengar nominal pada aplikasi keuangan lebih buruk daripada satu ketukan
    // konfirmasi tambahan.
    const handleTranscript = async (transcript) => {
        setVoiceError('');
        setVoiceLoading(true);
        try {
            const draft = await parseFromText(transcript);
            resetForm();
            setFormType(draft.type);
            setFormAmount(String(draft.amount));
            setFormDesc(draft.description);
            setFormCategory(draft.categoryId ?? '');
            setFormWallet(draft.walletId ?? '');
            setFormDate(draft.date);
            setShowForm(true);
        } catch (err) {
            setVoiceError(err.response?.data?.message || 'Gagal memproses suara. Coba lagi.');
        } finally {
            setVoiceLoading(false);
        }
    };

    const openEditForm = (txn) => {
        setEditingTxn(txn);
        setFormType(txn.type);
        setFormAmount(txn.amount.toString());
        setFormDesc(txn.description);
        setFormCategory(txn.categoryId);
        setFormWallet(txn.walletId || '');
        setFormDate(txn.date);
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formAmount || !formDesc || !formCategory || !formWallet) return;

        const data = {
            type: formType,
            amount: parseFloat(formAmount),
            description: formDesc,
            categoryId: parseInt(formCategory),
            walletId: parseInt(formWallet),
            date: formDate,
        };

        if (editingTxn) {
            updateTransaction(editingTxn.id, data);
        } else {
            addTransaction(data);
        }

        setShowForm(false);
        resetForm();
    };

    const handleDelete = () => {
        if (deletingTxn) {
            deleteTransaction(deletingTxn.id);
            setDeletingTxn(null);
        }
    };

    const filteredCategories = categories.filter((c) => c.type === formType);
    const filterCategories = categories.filter((c) => !filterType || c.type === filterType);
    const hasActiveFilters = filterType || filterCategory || filterDateFrom || filterDateTo;

    const handleFilterTypeChange = (nextType) => {
        setFilterType(nextType);
        if (!nextType || !filterCategory) return;

        const selectedCategory = categories.find((c) => String(c.id) === String(filterCategory));
        if (selectedCategory && selectedCategory.type !== nextType) {
            setFilterCategory('');
        }
    };

    return (
        <div className="page-container">
            <PageHeader title="Transaksi" />

            {/* Search & Filter Bar */}
            <div className="search-bar">
                <div className="search-bar__input-wrapper">
                    <Search size={16} className="search-bar__icon" />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-bar__input"
                    />
                    {search && (
                        <button className="search-bar__clear" onClick={() => setSearch('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    className={`search-bar__filter ${hasActiveFilters ? 'search-bar__filter--active' : ''}`}
                    onClick={() => setShowFilter(!showFilter)}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* Filter Panel */}
            {showFilter && (
                <Card className="filter-panel animate-slide-down mb-md">
                    <div className="form-group">
                        <label className="form-label">Tipe</label>
                        <div className="type-toggle">
                            <button
                                className={`type-toggle__btn ${filterType === '' ? 'type-toggle__btn--active-income' : ''}`}
                                onClick={() => handleFilterTypeChange('')}
                                style={filterType === '' ? { background: 'var(--accent-primary-glow)', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' } : {}}
                            >
                                Semua
                            </button>
                            <button
                                className={`type-toggle__btn ${filterType === 'income' ? 'type-toggle__btn--active-income' : ''}`}
                                onClick={() => handleFilterTypeChange('income')}
                            >
                                Pemasukan
                            </button>
                        </div>
                        <button
                            className={`type-toggle__btn ${filterType === 'expense' ? 'type-toggle__btn--active-expense' : ''}`}
                            onClick={() => handleFilterTypeChange('expense')}
                            style={{ width: '100%' }}
                        >
                            Pengeluaran
                        </button>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kategori</label>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="">Semua Kategori</option>
                            {filterCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <div className="form-row">
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                placeholder="Dari"
                            />
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                placeholder="Sampai"
                            />
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" fullWidth onClick={() => { setFilterType(''); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }}>
                            Reset Filter
                        </Button>
                    )}
                </Card>
            )}

            {/* Add Button */}
            <Button fullWidth onClick={openAddForm} icon={<Plus size={18} />}>
                Tambah Transaksi
            </Button>

            {/* Voice Input — hanya muncul kalau platformnya mendukung */}
            {isVoiceInputSupported() && (
                <div className="voice-input mb-lg">
                    <VoiceInputButton
                        onTranscript={handleTranscript}
                        onError={setVoiceError}
                        disabled={voiceLoading}
                    />
                    {voiceLoading && <p className="voice-input__status">Membaca ucapan...</p>}
                    {voiceError && <p className="voice-input__error">{voiceError}</p>}
                </div>
            )}

            {/* Transaction List */}
            <div className="stagger-children">
                {filteredTransactions.length === 0 ? (
                    <EmptyState
                        icon={<Search size={48} />}
                        title={search || hasActiveFilters ? 'Tidak ditemukan' : 'Belum ada transaksi'}
                        description={search || hasActiveFilters ? 'Coba ubah filter atau kata kunci' : 'Mulai kelola keuangan dengan menambahkan transaksi pertama'}
                        action={!search && !hasActiveFilters && (
                            <Button onClick={openAddForm} icon={<Plus size={16} />}>Tambah Transaksi</Button>
                        )}
                    />
                ) : (
                    filteredTransactions.map((txn) => {
                        const category = getCategoryById(txn.categoryId);
                        return (
                            <Card key={txn.id} className="txn-item">
                                <div
                                    className="txn-item__icon"
                                    style={{ background: category?.color + '20', color: category?.color }}
                                >
                                    {category?.name?.charAt(0) || '?'}
                                </div>
                                <div className="txn-item__info">
                                    <span className="txn-item__desc">{txn.description}</span>
                                    <span className="txn-item__cat">
                                        {category?.name || '-'} · {getWalletById(txn.walletId)?.name || '-'} · {formatShortDate(txn.date)}
                                    </span>
                                </div>
                                <span className={`txn-item__amount ${txn.type === 'income' ? 'text-income' : 'text-expense'}`}>
                                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                                </span>
                                <div className="txn-item__actions">
                                    <button className="txn-action-btn" onClick={() => openEditForm(txn)}>
                                        <Pencil size={14} />
                                    </button>
                                    <button className="txn-action-btn txn-action-btn--danger" onClick={() => setDeletingTxn(txn)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingTxn ? 'Edit Transaksi' : 'Transaksi Baru'}>
                <form onSubmit={handleSubmit}>
                    <div className="type-toggle">
                        <button
                            type="button"
                            className={`type-toggle__btn ${formType === 'income' ? 'type-toggle__btn--active-income' : ''}`}
                            onClick={() => { setFormType('income'); setFormCategory(''); }}
                        >
                            Pemasukan
                        </button>
                        <button
                            type="button"
                            className={`type-toggle__btn ${formType === 'expense' ? 'type-toggle__btn--active-expense' : ''}`}
                            onClick={() => { setFormType('expense'); setFormCategory(''); }}
                        >
                            Pengeluaran
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jumlah</label>
                        <CurrencyInput
                            placeholder="0"
                            value={formAmount}
                            onChange={(val) => setFormAmount(val)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Deskripsi</label>
                        <input
                            type="text"
                            placeholder="Contoh: Makan siang"
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required>
                                <option value="">Pilih</option>
                                {filteredCategories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kantong</label>
                            <select value={formWallet} onChange={(e) => setFormWallet(e.target.value)} required>
                                <option value="">Pilih</option>
                                {wallets.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <input
                            type="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" fullWidth className="mt-md">
                        {editingTxn ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deletingTxn}
                onClose={() => setDeletingTxn(null)}
                onConfirm={handleDelete}
                title="Hapus Transaksi?"
                message={`Transaksi "${deletingTxn?.description}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
