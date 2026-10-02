import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { useProfile } from '../../hooks/Useprofile';

export function ProfilePage() {
  const { profile, isLoading, error, refetch, updateProfile } = useProfile();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Họ và tên không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setNotice('Cập nhật thông tin cá nhân thành công.');
    } catch {
      setFormError('Không thể lưu thông tin. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-container" style={{ paddingBlock: '60px' }}>
        <LoadingSpinner message="Đang tải thông tin tài khoản..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-container" style={{ paddingBlock: '60px' }}>
        <ErrorState
          title="Không tải được hồ sơ"
          message={error || 'Đã có lỗi xảy ra khi truy vấn dữ liệu.'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="profile-page page-container" style={{ paddingBlock: '48px 72px' }}>
      <header style={{ maxWidth: '680px', marginBottom: '36px' }}>
        <span className="eyebrow">TÀI KHOẢN CỦA BẠN</span>
        <h1>Hồ sơ cá nhân</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          Quản lý thông tin liên hệ và bảo mật tài khoản tại Gia Lê Group.
        </p>
      </header>

      {notice && <div className="category-notice" role="status" style={{ marginBottom: '24px' }}>{notice}</div>}
      {formError && <div className="form-error-banner" role="alert" style={{ marginBottom: '24px' }}>{formError}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
        }}
      >
        {/* Thẻ tóm tắt thông tin */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--forest)',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
              }}
            >
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{profile.fullName}</h2>
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{profile.email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span
              className={`badge ${profile.status === 'ACTIVE' ? 'badge--success' : 'badge--warning'}`}
            >
              Trạng thái: {profile.status === 'ACTIVE' ? 'Đã kích hoạt' : profile.status}
            </span>
            {profile.roles?.map((role) => (
              <span key={role} className="badge badge--info">
                {role}
              </span>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', width: '100%', marginBlock: '12px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--ink-soft)' }}>
              Ngày tạo tài khoản:{' '}
              <strong style={{ color: 'var(--ink)' }}>
                {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
              </strong>
            </span>
            <Link
              to="/account/change-password"
              className="btn btn--ghost btn--sm"
              style={{ alignSelf: 'flex-start', marginTop: '12px' }}
            >
              🔒 Đổi mật khẩu đăng nhập
            </Link>
          </div>
        </div>

        {/* Form cập nhật */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '32px',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Chỉnh sửa thông tin</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="user-email">Địa chỉ Email (Không thể thay đổi)</label>
              <input
                id="user-email"
                type="email"
                disabled
                value={profile.email}
                className="form-input"
                style={{ backgroundColor: 'var(--cream-2)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-field">
              <label htmlFor="user-name">Họ và tên *</label>
              <input
                id="user-name"
                type="text"
                required
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
              />
            </div>

            <div className="form-field">
              <label htmlFor="user-phone">Số điện thoại liên hệ</label>
              <input
                id="user-phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0987 654 321"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn--accent"
              style={{ marginTop: '12px' }}
            >
              {isSubmitting ? 'Đang lưu thay đổi...' : 'Cập nhật hồ sơ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
