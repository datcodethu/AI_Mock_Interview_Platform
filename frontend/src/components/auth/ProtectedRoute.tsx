import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Bọc quanh các route cần đăng nhập mới xem được (VD: trang quản trị sản phẩm).
 * Cách dùng trong App.tsx:
 *
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/admin/products" element={<AdminProductsPage />} />
 *   </Route>
 *
 * 3 trạng thái cần xử lý — thiếu 1 trong 3 là bug thường gặp:
 *  1. isLoading = true  → CHƯA biết user đã login hay chưa (đang chờ bootstrapAuth
 *     ở AuthContext) → phải hiện loading, TUYỆT ĐỐI không redirect vội,
 *     nếu không sẽ có hiện tượng "nháy" về trang login rồi mới vào được trang đích.
 *  2. isAuthenticated = false → chưa đăng nhập → redirect /login,
 *     kèm `state={{ from: location }}` để sau khi login xong, đưa user quay lại
 *     đúng trang họ định vào (thay vì luôn đá về trang chủ).
 *  3. isAuthenticated = true → cho qua, render route con qua <Outlet />.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="auth-loading">Đang kiểm tra đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}