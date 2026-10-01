import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/categories', label: 'Danh mục' },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/blog', label: 'Tin tức' },
  { to: '/contact', label: 'Liên hệ' },
];

// Layout cho các trang công khai: header + nội dung (Outlet) + footer.
// <Outlet /> là "chỗ trống" — react-router nhét trang con vào đúng vị trí này.
export function MainLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.roles.includes('ADMIN') ?? false;
  const closeMenu = () => setMenuOpen(false);

  async function handleLogout() {
    await logout();
    closeMenu();
    navigate('/login');
  }

  return (
    <div className="main-layout">
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            GIA LÊ<span>·</span>GROUP
          </Link>

          <button
            className="menu-toggle"
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>

          <nav className={`site-nav ${menuOpen ? 'is-open' : ''}`}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}

            {/* Khu vực tài khoản: chờ isLoading xong mới hiện, tránh nháy "Đăng nhập" khi F5 */}
            {!isLoading && (
              <div className="site-nav__account">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" className="btn btn--ghost" onClick={closeMenu}>
                        Quản trị
                      </Link>
                    )}
                    <span className="account-name">{user?.fullName || user?.email}</span>
                    <Link to="/account/change-password" onClick={closeMenu}>
                      Đổi mật khẩu
                    </Link>
                    <button className="btn btn--ghost" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn--ghost" onClick={closeMenu}>
                      Đăng nhập
                    </Link>
                    <Link to="/register" className="btn btn--primary" onClick={closeMenu}>
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="main-layout__content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <strong>Công Ty TNHH Gia Lê Group</strong>
            <p>MST 0402188538 · P. Hoà Hải, Q. Ngũ Hành Sơn, Đà Nẵng</p>
          </div>
          <p>© {new Date().getFullYear()} Gia Lê Group</p>
        </div>
      </footer>
    </div>
  );
}