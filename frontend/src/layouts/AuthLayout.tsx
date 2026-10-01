import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layout cho login / register / quên mật khẩu: 1 thẻ căn giữa màn hình, không có menu.
export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Chưa biết đã đăng nhập hay chưa → chờ, tránh nháy form login rồi mới bị đá đi
  if (isLoading) {
    return <div className="auth-loading">Đang tải...</div>;
  }

  // Đã đăng nhập mà vẫn vào /login → đưa về trang trước đó (hoặc trang chủ)
  if (isAuthenticated && location.pathname !== '/register/verify') {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__card">
        <Link to="/" className="brand brand--center">
          GIA LÊ<span>·</span>GROUP
        </Link>
        <Outlet />
      </div>
      <Link to="/" className="auth-layout__back">
        ← Về trang chủ
      </Link>
    </div>
  );
}