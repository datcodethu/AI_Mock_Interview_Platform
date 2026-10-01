import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

type VerificationStatus = 'verifying' | 'verified' | 'failed';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const hasStarted = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>(token ? 'verifying' : 'failed');
  const [error, setError] = useState(
    token ? '' : 'Link xác thực không hợp lệ hoặc bị thiếu mã xác thực.',
  );

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (!token) return;
    const verificationToken = token;

    async function verify() {
      try {
        await verifyEmail(verificationToken);
        sessionStorage.removeItem('pendingEmailVerification');
        setStatus('verified');
        window.setTimeout(() => navigate('/', { replace: true }), 1500);
      } catch (requestError) {
        const message = axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message ?? 'Không thể xác thực email.'
          : requestError instanceof Error
            ? requestError.message
            : 'Không thể kết nối tới máy chủ.';
        setError(message);
        setStatus('failed');
      }
    }

    void verify();
  }, [navigate, token, verifyEmail]);

  return (
    <div className="auth-page">
      {status === 'verifying' && (
        <>
          <h1>Đang xác thực email</h1>
          <p>Vui lòng đợi trong khi chúng tôi xác nhận tài khoản của bạn.</p>
        </>
      )}
      {status === 'verified' && (
        <>
          <h1>Xác thực thành công</h1>
          <p>Email đã được xác thực và bạn đã đăng nhập. Đang chuyển tới trang chủ...</p>
        </>
      )}
      {status === 'failed' && (
        <>
          <h1>Không thể xác thực email</h1>
          <p role="alert">{error}</p>
          <div className="auth-links">
            <Link to="/register/check-email">Quay lại trang kiểm tra email</Link>
            <Link to="/login">Đăng nhập</Link>
          </div>
        </>
      )}
    </div>
  );
}
