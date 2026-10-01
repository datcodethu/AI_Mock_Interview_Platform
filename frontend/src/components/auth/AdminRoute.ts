import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Khác với ProtectedRoute (chỉ cần đăng nhập là đủ), route này còn kiểm tra thêm role.
 * Lưu ý: đây CHỈ là lớp bảo vệ ở UI (ẩn/hiện, tránh user thường lỡ vào nhầm trang admin) —
 * KHÔNG thay thế được việc bảo vệ ở backend. User có thể sửa code JS, mở DevTools console
 * gọi thẳng API — nếu backend không tự kiểm tra role (như lưu ý về SecurityConfig
 * "/admin/**" thiếu prefix /api/v1 ở tin trước), route này không bảo vệ được gì thật sự.
 */
export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return React.createElement('div', { className: 'auth-loading' }, 'Đang kiểm tra quyền truy cập...');
  }

  if (!isAuthenticated) {
    return React.createElement(Navigate, { to: '/login', replace: true });
  }

  if (!user?.roles.includes('ADMIN')) {
    return React.createElement(Navigate, { to: '/', replace: true });
  }

  return React.createElement(Outlet, null);
}