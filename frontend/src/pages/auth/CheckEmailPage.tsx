import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../../services/authService';

interface VerificationState {
  email?: string;
  expiresAt?: number;
}

function readSavedVerification(): VerificationState {
  const saved = sessionStorage.getItem('pendingEmailVerification');
  if (!saved) return {};

  try {
    const parsed: unknown = JSON.parse(saved);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'email' in parsed &&
      'expiresAt' in parsed &&
      typeof parsed.email === 'string' &&
      typeof parsed.expiresAt === 'number'
    ) {
      return { email: parsed.email, expiresAt: parsed.expiresAt };
    }
  } catch {
    sessionStorage.removeItem('pendingEmailVerification');
  }
  return {};
}

function formatRemainingTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function CheckEmailPage() {
  const location = useLocation();
  const routeState = (location.state as VerificationState | null) ?? {};
  const [savedVerification] = useState(readSavedVerification);
  const email = routeState.email ?? savedVerification.email;
  const [expiresAt, setExpiresAt] = useState(
    routeState.expiresAt ?? savedVerification.expiresAt,
  );
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0,
  );
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const updateRemaining = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };
    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  async function handleResend() {
    if (!email || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const newExpiresAt = await authService.resendVerification(email);
      sessionStorage.setItem(
        'pendingEmailVerification',
        JSON.stringify({ email, expiresAt: newExpiresAt }),
      );
      setExpiresAt(newExpiresAt);
      setRemainingSeconds(Math.max(0, Math.ceil((newExpiresAt - Date.now()) / 1000)));
      setResent(true);
    } catch (requestError) {
      const message =
        axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message ?? 'Không thể gửi lại email xác thực.'
          : 'Không thể kết nối tới máy chủ.';
      setError(message);
    } finally {
      setIsResending(false);
    }
  }

  const isExpired = remainingSeconds <= 0;

  return (
    <div className="auth-page">
      <h1>Kiểm tra email của bạn</h1>
      <p>
        Chúng tôi đã gửi link xác thực tới <strong>{email ?? 'email của bạn'}</strong>. Vui lòng
        bấm vào link trong email để kích hoạt tài khoản.
      </p>
      <p role="status" aria-live="polite">
        {isExpired
          ? 'Link xác thực đã hết hạn.'
          : `Link xác thực còn hiệu lực: ${formatRemainingTime(remainingSeconds)}`}
      </p>
      {error && (
        <div role="alert" className="form-error-banner">
          {error}
        </div>
      )}
      <button onClick={handleResend} disabled={!email || isResending || (resent && !isExpired)}>
        {isResending
          ? 'Đang gửi...'
          : resent && !isExpired
            ? 'Đã gửi lại email xác thực'
            : 'Gửi lại email xác thực'}
      </button>
      <div className="auth-links">
        <Link to="/login">Quay lại đăng nhập</Link>
      </div>
    </div>
  );
}
