import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Admin.css';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: (props: { className?: string }) => React.JSX.Element;
  submenu?: { to: string; label: string }[];
}

interface NavGroup {
  groupLabel?: string;
  items: NavItem[];
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    groupLabel: 'OVERVIEW',
    items: [
      {
        to: '/admin',
        label: 'Tổng quan',
        end: true,
        icon: () => (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    groupLabel: 'PRODUCT MANAGEMENT',
    items: [
      {
        to: '/admin/products',
        label: 'Sản phẩm',
        icon: () => (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        ),
      },
      {
        to: '/admin/categories',
        label: 'Danh mục',
        icon: () => (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        ),
      },
    ],
  },
  {
    groupLabel: 'USER MANAGEMENT',
    items: [
      {
        to: '/admin/users',
        label: 'Người dùng',
        icon: () => (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ],
  },
  {
    groupLabel: 'HELP & SUPPORT',
    items: [
      {
        to: '/',
        label: 'Về website',
        icon: () => (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        ),
      },
    ],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleLogout() {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  }

  const initial = (user?.fullName || user?.email || 'A').charAt(0).toUpperCase();
  const roleName = user?.roles?.[0]?.replace('ROLE_', '') || 'ADMIN';

  return (
    <div className={`sellzy-layout ${isCollapsed ? 'has-collapsed-sidebar' : ''}`}>
      {/* SIDEBAR TRÁI (FULL-HEIGHT, FIXED, 270px) */}
      <aside className={`sellzy-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`}>
        {/* Nút thu gọn sidebar đè lên mép phải sidebar */}
        <button
          type="button"
          className="sellzy-sidebar__collapse-btn"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label="Thu gọn sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* LOGO TRÊN CÙNG */}
        <div className="sellzy-sidebar__brand">
          <div className="sellzy-sidebar__logo-mark">S</div>
          <div className="sellzy-sidebar__logo-text">
            Sellzy<span>Admin</span>
          </div>
        </div>

        {/* MENU CHIA NHÓM */}
        <nav className="sellzy-sidebar__nav">
          {ADMIN_GROUPS.map((group, gIdx) => (
            <div key={`group-${gIdx}`}>
              {group.groupLabel && (
                <div className="sellzy-sidebar__group-label">
                  {isCollapsed ? '•••' : group.groupLabel}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to) && item.to !== '/';

                return (
                  <div key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={`sellzy-sidebar__item ${isActive ? 'is-active' : ''}`}
                    >
                      <span className="sellzy-sidebar__item-icon">
                        <Icon />
                      </span>
                      <span className="sellzy-sidebar__item-label">{item.label}</span>

                      {/* CHỈ hiện chevron '>' khi item THẬT SỰ có submenu */}
                      {hasSubmenu && (
                        <svg
                          className="sellzy-sidebar__chevron"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </NavLink>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* OVERLAY MỜ TRÊN MOBILE */}
      {mobileOpen && (
        <div className="sellzy-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* KHUNG MAIN CHÍNH */}
      <div className="sellzy-main">
        {/* TOPBAR */}
        <header className="sellzy-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Hamburger toggle cho mobile */}
            <button
              type="button"
              className="sellzy-mobile-toggle"
              aria-label="Mở menu quản trị"
              onClick={() => setMobileOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Thanh search dạng pill, bo tròn, nền xám nhạt, lệch trái */}
            <div className="sellzy-topbar__search">
              <span className="sellzy-topbar__search-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Tìm kiếm nhanh..."
                className="sellzy-topbar__search-input"
              />
            </div>
          </div>

          {/* Bên phải: Icon thông báo + Avatar user + Role + Dropdown */}
          <div className="sellzy-topbar__right">
            {/* Icon thông báo có badge số đếm cam/đỏ nổi bật */}
            <button
              type="button"
              className="sellzy-topbar__notify-btn"
              title="Thông báo hệ thống"
              aria-label="Thông báo"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="sellzy-topbar__notify-badge">3</span>
            </button>

            {/* Avatar + Tên + Vai trò + Chevron Dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                className="sellzy-topbar__user"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
              >
                <div className="sellzy-topbar__avatar">{initial}</div>
                <div className="sellzy-topbar__user-info">
                  <span className="sellzy-topbar__user-name">
                    {user?.fullName || user?.email || 'Quản trị viên'}
                  </span>
                  <span className="sellzy-topbar__user-role">{roleName}</span>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Menu Dropdown khi click */}
              {userMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 55 }}
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="sellzy-topbar__dropdown">
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--admin-border-subtle)', marginBottom: '4px' }}>
                      <strong style={{ display: 'block', fontSize: '0.84rem' }}>{user?.fullName || 'Admin'}</strong>
                      <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>{user?.email}</span>
                    </div>

                    <Link
                      to="/profile"
                      className="sellzy-topbar__dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                      <span>Trang cá nhân</span>
                    </Link>

                    <button
                      type="button"
                      className="sellzy-topbar__dropdown-item sellzy-topbar__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA (Nền --admin-page-bg) */}
        <main className="sellzy-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}