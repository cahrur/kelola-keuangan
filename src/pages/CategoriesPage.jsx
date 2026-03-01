import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import useCategoryStore from '../stores/categoryStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { generateId } from '../utils/formatters';
import './CategoriesPage.css';
import PageHeader from '../components/layout/PageHeader';

const ICON_OPTIONS = [
    'Briefcase', 'Laptop', 'TrendingUp', 'Plus', 'UtensilsCrossed', 'Car',
    'ShoppingBag', 'Receipt', 'Gamepad2', 'Heart', 'GraduationCap',
    'MoreHorizontal', 'Home', 'Wifi', 'Phone', 'Gift', 'Coffee', 'Zap',
];

const COLOR_OPTIONS = [
    '#3b987b', '#22c55e', '#98503b', '#0ea5e9', '#98873b', '#8b5cf6',
    '#2d7660', '#5fb89a', '#ef4444', '#f97316', '#ec4899', '#14b8a6',
    '#00cec9', '#d63031', '#a29bfe', '#ff7675', '#74b9ff', '#55efc4',
    '#636e72', '#fab1a0', '#81ecec', '#dfe6e9',
];

export default function CategoriesPage() {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();

    const [showForm, setShowForm] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [deletingCat, setDeletingCat] = useState(null);

    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState('expense');
    const [formIcon, setFormIcon] = useState(ICON_OPTIONS[0]);
    const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);

    const incomeCategories = categories.filter((c) => c.type === 'income');
    const expenseCategories = categories.filter((c) => c.type === 'expense');

    const resetForm = () => {
        setFormName('');
        setFormType('expense');
        setFormIcon(ICON_OPTIONS[0]);
        setFormColor(COLOR_OPTIONS[0]);
        setEditingCat(null);
    };

    const openEdit = (cat) => {
        setEditingCat(cat);
        setFormName(cat.name);
        setFormType(cat.type);
        setFormIcon(cat.icon);
        setFormColor(cat.color);
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formName.trim()) return;

        const data = { name: formName, type: formType, icon: formIcon, color: formColor };

        if (editingCat) {
            updateCategory(editingCat.id, data);
        } else {
            addCategory(data);
        }
        setShowForm(false);
        resetForm();
    };

    const handleDelete = () => {
        if (deletingCat) {
            deleteCategory(deletingCat.id);
            setDeletingCat(null);
        }
    };

    const renderCategoryGroup = (title, cats, colorClass) => (
        <div className="mb-lg">
            <h2 className="section-title">
                <span className={colorClass}>{title}</span>
                <span className="text-muted" style={{ fontSize: 'var(--font-sm)', fontWeight: 400 }}>
                    {cats.length} kategori
                </span>
            </h2>
            <div className="category-grid stagger-children">
                {cats.map((cat) => (
                    <Card key={cat.id} className="category-card">
                        <div className="category-card__icon" style={{ background: cat.color + '20', color: cat.color }}>
                            {cat.name.charAt(0)}
                        </div>
                        <span className="category-card__name">{cat.name}</span>
                        <div className="category-card__actions">
                            <button className="txn-action-btn" onClick={() => openEdit(cat)}>
                                <Pencil size={12} />
                            </button>
                            <button className="txn-action-btn txn-action-btn--danger" onClick={() => setDeletingCat(cat)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="page-container">
            <PageHeader title="Kategori" />

            <Button fullWidth className="mb-lg" onClick={() => { resetForm(); setShowForm(true); }} icon={<Plus size={18} />}>
                Tambah Kategori
            </Button>

            {renderCategoryGroup('Pemasukan', incomeCategories, 'text-income')}
            {renderCategoryGroup('Pengeluaran', expenseCategories, 'text-expense')}

            {/* Form Modal */}
            <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingCat ? 'Edit Kategori' : 'Kategori Baru'}>
                <form onSubmit={handleSubmit}>
                    <div className="type-toggle">
                        <button
                            type="button"
                            className={`type-toggle__btn ${formType === 'income' ? 'type-toggle__btn--active-income' : ''}`}
                            onClick={() => setFormType('income')}
                        >
                            Pemasukan
                        </button>
                        <button
                            type="button"
                            className={`type-toggle__btn ${formType === 'expense' ? 'type-toggle__btn--active-expense' : ''}`}
                            onClick={() => setFormType('expense')}
                        >
                            Pengeluaran
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nama Kategori</label>
                        <input
                            type="text"
                            placeholder="Contoh: Groceries"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Warna</label>
                        <div className="color-picker">
                            {COLOR_OPTIONS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-picker__item ${formColor === c ? 'color-picker__item--active' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setFormColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <Button type="submit" fullWidth className="mt-md">
                        {editingCat ? 'Simpan' : 'Tambah'}
                    </Button>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deletingCat}
                onClose={() => setDeletingCat(null)}
                onConfirm={handleDelete}
                title="Hapus Kategori?"
                message={`Kategori "${deletingCat?.name}" akan dihapus. Transaksi terkait tidak akan terhapus.`}
            />
        </div>
    );
}
