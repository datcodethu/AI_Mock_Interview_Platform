import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../../services/authService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (requestError) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message ?? 'Không thể gửi yêu cầu. Vui lòng thử lại.'
        : 'Không thể kết nối tới máy chủ.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Quên mật khẩu</h1>
      {isSubmitted ? (
        <>
          <p role="status">
            Nếu email này đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu. Hãy kiểm tra hộp
            thư của bạn.
          </p>
          <div className="auth-links">
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <p>Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p>
          {error && <div role="alert" className="form-error-banner">{error}</div>}
          <div className="form-field">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi hướng dẫn'}
          </button>
          <div className="auth-links">
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        </form>
      )}
    </div>
  );
}
