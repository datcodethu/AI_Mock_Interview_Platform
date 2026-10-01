import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
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
      await changePassword({ oldPassword, newPassword, confirmPassword });
      navigate('/login', {
        replace: true,
        state: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' },
      });
    } catch (requestError) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message ?? 'Không thể đổi mật khẩu. Vui lòng thử lại.'
        : 'Không thể kết nối tới máy chủ.';
      setError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page" aria-labelledby="change-password-title">
      <h1 id="change-password-title">Đổi mật khẩu</h1>
      <form onSubmit={handleSubmit} noValidate>
        {error && <div role="alert" className="form-error-banner">{error}</div>}
        <div className="form-field">
          <label htmlFor="old-password">Mật khẩu hiện tại</label>
          <input
            id="old-password"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            required
          />
        </div>
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
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </button>
        <div className="auth-links">
          <Link to="/">Hủy</Link>
        </div>
      </form>
    </section>
  );
}
