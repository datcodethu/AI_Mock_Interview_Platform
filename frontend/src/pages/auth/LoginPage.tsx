import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

/**
 * Form login viết bằng useState thuần (không dùng react-hook-form) để bạn
 * nhìn rõ luồng dữ liệu mà không cần học thêm thư viện mới cùng lúc.
 * Khi quen rồi, ở form phức tạp hơn (nhiều field, validate rắc rối) nên
 * chuyển sang `react-hook-form` + `zod` — cài thêm:
 *   npm install react-hook-form zod @hookform/resolvers
 * → giảm code lặp lại rất nhiều, nhưng bản chất luồng vẫn giống hệt bên dưới.
 */

interface FormErrors {
  email?: string;
  password?: string;
  general?: string; // lỗi chung, không thuộc field nào (VD: sai mật khẩu)
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) {
    errors.email = 'Vui lòng nhập email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email không đúng định dạng';
  }
  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  }
  return errors;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu user bị redirect vào /login từ 1 trang cần đăng nhập (ProtectedRoute),
  // location.state.from sẽ chứa trang họ định vào ban đầu — đưa họ quay lại đó
  // thay vì luôn đá về trang chủ, trải nghiệm mượt hơn nhiều.
  
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
  const notice = (location.state as { message?: string })?.message;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(email, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      // Phân biệt rõ 3 loại lỗi — mỗi loại cần thông báo khác nhau cho user:
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrors({ general: '  Email hoặc mật khẩu không đúng' });
        } else if (err.response?.status === 403) {
          setErrors({ general: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư.' });
        } else {
          setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại sau' });
        }
      } else {
        setErrors({ general: 'Không thể kết nối tới máy chủ' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} noValidate>
        <h1>Đăng nhập</h1>

        {notice && <div role="status">{notice}</div>}

        {errors.general && (
          <div role="alert" className="form-error-banner">
            {errors.general}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            autoComplete="email"
          />
          {errors.email && <span id="email-error" className="field-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            autoComplete="current-password"
          />
          {errors.password && <span id="password-error" className="field-error">{errors.password}</span>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div className="auth-links">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Chưa có tài khoản? Đăng ký</Link>
        </div>
      </form>
    </div>
  );
}