import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, HandCoins, CalendarCheck, Tag, PiggyBank, BarChart3, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

const DRAWER_NAV = [
    { to: '/debts', icon: HandCoins, label: 'Hutang' },
    { to: '/obligations', icon: CalendarCheck, label: 'Tanggungan' },
    { to: '/categories', icon: Tag, label: 'Kategori' },
    { to: '/budgets', icon: PiggyBank, label: 'Anggaran' },
    { to: '/reports', icon: BarChart3, label: 'Laporan' },
    { to: '/settings', icon: Settings, label: 'Setelan' },
];

export default function PageHeader({ title, subtitle, actions }) {
    const [showDrawer, setShowDrawer] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = async () => {
        setShowDrawer(false);
        await logout();
        navigate('/login');
    };

    return (
        <>
            <div className="page-header">
                <div className="page-header__left">
                    <button className="page-header__btn" onClick={() => setShowDrawer(true)}>
                        <Menu size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">{title}</h1>
                        {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    </div>
                </div>
                {actions && <div className="page-header__actions">{actions}</div>}
            </div>

            {/* Drawer */}
            {showDrawer && (
                <div className="page-drawer-overlay" onClick={() => setShowDrawer(false)}>
                    <div className="page-drawer" onClick={(e) => e.stopPropagation()}>
                        {/* Logo */}
                        <div className="page-drawer__logo">
                            <img src="/logo.png" alt="Kelola Keuangan" className="page-drawer__logo-img" />
                            <span className="page-drawer__logo-text">Kelola Keuangan</span>
                        </div>

                        {/* Nav items */}
                        <div className="page-drawer__nav">
                            {DRAWER_NAV.map(({ to, icon: Icon, label }) => {
                                const isActive = location.pathname === to;
                                return (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className={`page-drawer__item ${isActive ? 'page-drawer__item--active' : ''}`}
                                        onClick={() => setShowDrawer(false)}
                                    >
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                        <span>{label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>

                        {/* Logout */}
                        <button className="page-drawer__logout" onClick={handleLogout}>
                            <LogOut size={18} />
                            <span>Keluar</span>
                        </button>

                        {/* Close button */}
                        <button className="page-drawer__close" onClick={() => setShowDrawer(false)}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
