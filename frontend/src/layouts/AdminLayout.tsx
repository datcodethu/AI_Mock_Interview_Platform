import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Thêm mục menu admin mới: chỉ cần thêm 1 dòng vào mảng này (và 1 <Route> trong App.tsx)
const ADMIN_NAV = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/categories', label: 'Danh mục' },
];

// Layout khu quản trị: sidebar trái + topbar + nội dung.
// Layout này KHÔNG tự chặn quyền — việc đó do <AdminRoute /> bọc bên ngoài lo (xem App.tsx).
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar__brand">
          GIA LÊ<span>·</span>ADMIN
        </div>

        <nav className="admin-sidebar__nav">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/" className="admin-sidebar__back">
          ← Về website
        </Link>
      </aside>

      {/* Lớp phủ mờ trên mobile: bấm ra ngoài để đóng sidebar */}
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="menu-toggle"
            aria-label="Mở menu quản trị"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            ☰
          </button>
          <div className="admin-topbar__user">
            <span>{user?.fullName || user?.email}</span>
            <button className="btn btn--ghost" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}