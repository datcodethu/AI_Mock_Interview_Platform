import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';

import { HomePage } from './pages/home/HomePage';
import { PublicCategoriesPage } from './pages/categories/PublicCategoriesPage';
import { PublicCategoryDetailPage } from './pages/categories/PublicCategoryDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { CheckEmailPage } from './pages/auth/CheckEmailPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ChangePasswordPage } from './pages/account/ChangePasswordPage';
import { AdminDashboardPage } from './admin/Admindashboardpage';
import { AdminUsersPage } from './admin/Adminuserspage';
import { AdminCategoriesPage } from './admin/AdminCategoriesPage';
import { AdminProductsPage } from './admin/AdminProductsPage';
import { PublicProductsPage } from './pages/products/PublicProductsPage';
import { PublicProductDetailPage } from './pages/products/PublicProductDetailPage';
import { BlogPage } from './pages/blog/BlogPage';
import { ContactPage } from './pages/contact/ContactPage';
import { ProfilePage } from './pages/account/ProfilePage';
import './styles/DesignSystem.css';
import './App.css';
import './styles/Layouts.css';
import './styles/Products.css';
/**
 * Cách đọc file này: mỗi <Route element={<Layout />}> là 1 "khung",
 * các <Route> con bên trong sẽ được nhét vào <Outlet /> của khung đó.
 *
 *   Route cha (layout)  →  vẽ khung (header/sidebar...)
 *     └ Route con (page)  →  vẽ nội dung, nằm vào chỗ <Outlet />
 *
 * Route "bọc" (ProtectedRoute, AdminRoute) không vẽ gì, chỉ quyết định cho đi tiếp hay chặn.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Website công khai */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<PublicCategoriesPage />} />
            <Route path="/categories/:slug" element={<PublicCategoryDetailPage />} />
            <Route path="/products" element={<PublicProductsPage />} />
            <Route path="/products/:slug" element={<PublicProductDetailPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Cần đăng nhập nhưng vẫn dùng khung website (VD: trang profile) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/account/change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>

          {/* Đăng nhập / đăng ký */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/check-email" element={<CheckEmailPage />} />
            <Route path="/register/verify" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Khu quản trị: AdminRoute chặn quyền TRƯỚC, rồi mới vẽ AdminLayout */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}