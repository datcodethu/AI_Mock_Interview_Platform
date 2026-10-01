import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface FormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Email không đúng định dạng';
  if (!values.phoneNumber.trim()) errors.phoneNumber = 'Vui lòng nhập số điện thoại';

  // Quy tắc mật khẩu này CẦN khớp với validate ở backend (thường dùng @Pattern trong DTO).
  // Nếu backend yêu cầu khác (VD: bắt buộc ký tự đặc biệt), sửa lại regex bên dưới
  // và thông báo lỗi cho khớp — validate 2 phía LỆCH NHAU là lỗi rất hay gặp,
  // gây trải nghiệm "FE báo hợp lệ nhưng backend vẫn từ chối".
  if (values.password.length < 8) {
    errors.password = 'Mật khẩu tối thiểu 8 ký tự';
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  }
  return errors;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      const registration = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
      });
      sessionStorage.setItem(
        'pendingEmailVerification',
        JSON.stringify({ email: registration.email, expiresAt: registration.expiresAt }),
      );
      // KHÔNG tự động đăng nhập ở đây (xem giải thích trong AuthContext.tsx —
      // tài khoản đang ở trạng thái PENDING_VERIFY, backend sẽ từ chối login
      // cho tới khi xác thực email).
      navigate('/register/check-email', {
        state: { email: registration.email, expiresAt: registration.expiresAt },
      });
    } catch (err) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        const serverMessage = err.response?.data?.message;
        if (err.response?.status === 409) {
          setErrors({ email: serverMessage ?? 'Email hoặc số điện thoại này đã được đăng ký' });
        } else if (err.response?.status === 400) {
          setErrors({ general: serverMessage ?? 'Thông tin đăng ký không hợp lệ' });
        } else if (serverMessage) {
          setErrors({ general: serverMessage });
        } else if (err.response) {
          setErrors({
            general: 'Máy chủ đã từ chối yêu cầu đăng ký. Vui lòng kiểm tra thông tin hoặc thử lại sau.',
          });
        } else if (err.request) {
          setErrors({
            general: 'Không nhận được phản hồi từ máy chủ. Hãy thử đăng ký lại; nếu tài khoản đã được tạo, email xác thực sẽ được gửi lại.',
          });
        } else {
          setErrors({ general: 'Không thể gửi yêu cầu đăng ký. Vui lòng thử lại.' });
        }
      } else {
        setErrors({ general: 'Đã xảy ra lỗi không xác định khi đăng ký.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} noValidate>
        <h1>Tạo tài khoản</h1>

        {errors.general && (
          <div role="alert" className="form-error-banner">
            {errors.general}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="fullName">Họ và tên</label>
          <input
            id="fullName"
            value={values.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => updateField('email', e.target.value)}
            aria-invalid={!!errors.email}
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="phoneNumber">Số điện thoại</label>
          <input
            id="phoneNumber"
            type="tel"
            value={values.phoneNumber}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            aria-invalid={!!errors.phoneNumber}
            autoComplete="tel"
          />
          {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={(e) => updateField('password', e.target.value)}
            aria-invalid={!!errors.password}
            autoComplete="new-password"
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
          <input
            id="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            aria-invalid={!!errors.confirmPassword}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>

        <div className="auth-links">
          <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
}