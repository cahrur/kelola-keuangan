import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Wallet, HandCoins, BarChart3, Menu, Tag, PiggyBank, CalendarCheck, Settings, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import './BottomNav.css';

const MAIN_NAV = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
    { to: '/wallets', icon: Wallet, label: 'Kantong' },
    { to: '/debts', icon: HandCoins, label: 'Hutang' },
];

const MORE_NAV = [
    { to: '/obligations', icon: CalendarCheck, label: 'Tanggungan' },
    { to: '/categories', icon: Tag, label: 'Kategori' },
    { to: '/budgets', icon: PiggyBank, label: 'Anggaran' },
    { to: '/reports', icon: BarChart3, label: 'Laporan' },
    { to: '/settings', icon: Settings, label: 'Setelan' },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAuthStore((s) => s.logout);
    const [showMore, setShowMore] = useState(false);

    const handleLogout = async () => {
        setShowMore(false);
        await logout();
        navigate('/login');
    };

    const isMoreActive = MORE_NAV.some(
        (item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
    );

    return (
        <>
            {/* More Menu Overlay */}
            {showMore && (
                <div className="more-overlay" onClick={() => setShowMore(false)}>
                    <div className="more-menu animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="more-menu__header">
                            <span className="more-menu__title">Lainnya</span>
                            <button className="more-menu__close" onClick={() => setShowMore(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="more-menu__grid">
                            {MORE_NAV.map(({ to, icon: Icon, label }) => {
                                const isActive = location.pathname === to;
                                return (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className={`more-menu__item ${isActive ? 'more-menu__item--active' : ''}`}
                                        onClick={() => setShowMore(false)}
                                    >
                                        <div className="more-menu__icon">
                                            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                                        </div>
                                        <span>{label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                        <button className="more-menu__logout" onClick={handleLogout}>
                            <LogOut size={18} />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            )}

            <nav className="bottom-nav">
                <div className="bottom-nav__inner">
                    {MAIN_NAV.map(({ to, icon: Icon, label }) => {
                        const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                        return (
                            <NavLink
                                key={to}
                                to={to}
                                className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                <span className="bottom-nav__label">{label}</span>
                            </NavLink>
                        );
                    })}
                    <button
                        className={`bottom-nav__item ${isMoreActive || showMore ? 'bottom-nav__item--active' : ''}`}
                        onClick={() => setShowMore(!showMore)}
                    >
                        <Menu size={20} strokeWidth={isMoreActive || showMore ? 2.5 : 1.5} />
                        <span className="bottom-nav__label">Lainnya</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
