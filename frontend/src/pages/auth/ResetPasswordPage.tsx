import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../../services/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Link đặt lại mật khẩu thiếu mã xác thực. Hãy yêu cầu gửi lại email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, newPassword });
      navigate('/login', {
        replace: true,
        state: { message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.' },
      });
    } catch (requestError) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message ?? 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
        : 'Không thể kết nối tới máy chủ.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Đặt lại mật khẩu</h1>
      <form onSubmit={handleSubmit} noValidate>
        {!token && (
          <div role="alert" className="form-error-banner">
            Link đặt lại mật khẩu thiếu mã xác thực. Hãy yêu cầu gửi lại email.
          </div>
        )}
        {error && <div role="alert" className="form-error-banner">{error}</div>}
        <div className="form-field">
          <label htmlFor="new-password">Mật khẩu mới</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="confirm-password">Nhập lại mật khẩu mới</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting || !token}>
          {isSubmitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
        </button>
        <div className="auth-links">
          <Link to="/forgot-password">Yêu cầu link mới</Link>
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </form>
    </div>
  );
}
