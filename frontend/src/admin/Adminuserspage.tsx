import { useState } from 'react';
import { useAdminUsers } from '../hooks/Useadminusers';
import { AdminCard } from '../components/admin/AdminCard';
import { AdminTable, type AdminTableColumn, type AdminTableAction } from '../components/admin/AdminTable';
import { AdminPagination } from '../components/admin/AdminPagination';
import type { UserProfile } from '../types/User.types';

export function AdminUsersPage() {
  const {
    users,
    totalPages,
    totalElements,
    params,
    setParams,
    isLoading,
    error,
    lockUser,
    unlockUser,
  } = useAdminUsers({ page: 0, size: 10 });

  const [searchInput, setSearchInput] = useState(params.search ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const currentPage = params.page ?? 0;
  const currentSize = params.size ?? 10;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParams((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 0 }));
  }

  function handleSelectRow(id: string, selected: boolean) {
    setSelectedIds((prev) => (selected ? [...prev, id] : prev.filter((item) => item !== id)));
  }

  function handleSelectAll(selected: boolean) {
    setSelectedIds(selected ? users.map((u) => u.id) : []);
  }

  async function handleToggleLock(user: UserProfile) {
    setNotice(null);
    setActionLoadingId(user.id);
    try {
      if (user.status === 'LOCKED') {
        await unlockUser(user.id);
        setNotice(`Đã mở khóa tài khoản: ${user.email}`);
      } else {
        if (!window.confirm(`Bạn có chắc chắn muốn khóa tài khoản "${user.email}"?`)) {
          return;
        }
        await lockUser(user.id);
        setNotice(`Đã khóa tài khoản: ${user.email}`);
      }
    } catch {
      setNotice(`Thao tác khóa/mở khóa thất bại cho tài khoản: ${user.email}`);
    } finally {
      setActionLoadingId(null);
      if (viewingUser?.id === user.id) {
        setViewingUser(null);
      }
    }
  }

  // Định nghĩa các cột cho AdminTable
  const columns: AdminTableColumn<UserProfile>[] = [
    {
      header: 'Thành viên',
      render: (u) => {
        const initial = (u.fullName || u.email || 'U').charAt(0).toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--admin-active-bg)',
                color: 'var(--admin-sidebar)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--admin-text-main)', fontSize: '0.92rem' }}>
                {u.fullName || 'Chưa cập nhật tên'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-soft)' }}>
                {u.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Số điện thoại',
      render: (u) => (
        <span style={{ fontSize: '0.86rem', color: u.phone ? 'var(--admin-text-main)' : 'var(--admin-text-muted)' }}>
          {u.phone || '—'}
        </span>
      ),
    },
    {
      header: 'Vai trò',
      render: (u) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {u.roles?.map((r) => (
            <span
              key={r}
              className={`admin-role-badge ${r.toUpperCase().includes('ADMIN') ? 'admin-role-badge--admin' : ''}`}
            >
              {r}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      render: (u) => (
        <span
          className={`admin-status-pill ${
            u.status === 'ACTIVE'
              ? 'admin-status-pill--active'
              : u.status === 'LOCKED'
              ? 'admin-status-pill--locked'
              : 'admin-status-pill--pending'
          }`}
        >
          <span className="admin-status-dot" />
          {u.status === 'ACTIVE'
            ? 'Hoạt động'
            : u.status === 'LOCKED'
            ? 'Đã khóa'
            : 'Chờ xác thực'}
        </span>
      ),
    },
    {
      header: 'Ngày tạo',
      render: (u) => (
        <span style={{ fontSize: '0.84rem', color: 'var(--admin-text-soft)' }}>
          {u.createdAt
            ? new Date(u.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            : '—'}
        </span>
      ),
    },
  ];

  // Thao tác phụ trong menu '...'
  const moreActions: AdminTableAction<UserProfile>[] = [
    {
      label: 'Khóa / Mở khóa tài khoản',
      danger: true,
      onClick: (u) => void handleToggleLock(u),
    },
  ];

  // Toolbar tầng 2
  const toolbar = (
    <>
      <div className="admin-card__toolbar-left">
        <form onSubmit={handleSearchSubmit} className="admin-table-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Tìm theo email, tên, số điện thoại..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      <div className="admin-card__toolbar-right">
        <select
          value={params.status ?? ''}
          onChange={(e) =>
            setParams((prev) => ({
              ...prev,
              status: (e.target.value as UserProfile['status']) || undefined,
              page: 0,
            }))
          }
          className="admin-table-filter"
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động (ACTIVE)</option>
          <option value="PENDING_VERIFY">Chờ xác thực (PENDING)</option>
          <option value="LOCKED">Đã khóa (LOCKED)</option>
        </select>

        <select
          value={params.role ?? ''}
          onChange={(e) =>
            setParams((prev) => ({
              ...prev,
              role: e.target.value || undefined,
              page: 0,
            }))
          }
          className="admin-table-filter"
          aria-label="Lọc theo vai trò"
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
          <option value="RECRUITER">RECRUITER</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSearchInput('');
            setParams({ page: 0, size: 10 });
          }}
          className="admin-btn-pill admin-btn-pill--ghost"
          style={{ height: '38px', padding: '0 16px', fontSize: '0.84rem' }}
        >
          Đặt lại
        </button>
      </div>
    </>
  );

  return (
    <>
      <AdminCard
        title="Quản lý người dùng"
        subtitle="Kiểm soát danh sách tài khoản khách hàng, nhân sự và phân quyền truy cập."
        primaryAction={{
          label: 'Xuất danh sách',
          icon: (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          ),
          onClick: () => alert('Tính năng xuất file CSV/Excel đang được xử lý.'),
        }}
        toolbar={toolbar}
      >
        {notice && (
          <div
            role="status"
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              background: '#EAF7EE',
              color: '#1E6B38',
              fontSize: '0.88rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>✓ {notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              background: '#FDF0EE',
              color: '#B3261E',
              fontSize: '0.88rem',
              marginBottom: '18px',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* BẢNG DỮ LIỆU AIRY & DÙNG CHUNG */}
        <AdminTable<UserProfile>
          columns={columns}
          data={users}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          onViewDetail={(u) => setViewingUser(u)}
          moreActions={moreActions}
          isLoading={isLoading}
          emptyMessage="Không tìm thấy người dùng nào phù hợp với bộ lọc."
        />

        {/* PHÂN TRANG CHUẨN */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={currentSize}
          onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
          onPageSizeChange={(s) => setParams((prev) => ({ ...prev, size: s, page: 0 }))}
        />
      </AdminCard>

      {/* MODAL XEM CHI TIẾT NGƯỜI DÙNG KHI BẤM ICON CON MẮT */}
      {viewingUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(13, 59, 59, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 12px 36px rgba(13, 59, 59, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--admin-sidebar)' }}>
                Chi tiết tài khoản
              </h2>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--admin-text-soft)', display: 'block', fontSize: '0.8rem' }}>Mã định danh (ID)</span>
                <code>{viewingUser.id}</code>
              </div>

              <div>
                <span style={{ color: 'var(--admin-text-soft)', display: 'block', fontSize: '0.8rem' }}>Họ và tên</span>
                <strong>{viewingUser.fullName || 'Chưa cập nhật'}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--admin-text-soft)', display: 'block', fontSize: '0.8rem' }}>Địa chỉ Email</span>
                <span>{viewingUser.email}</span>
              </div>

              <div>
                <span style={{ color: 'var(--admin-text-soft)', display: 'block', fontSize: '0.8rem' }}>Số điện thoại</span>
                <span>{viewingUser.phone || 'Chưa cung cấp'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--admin-text-soft)', display: 'block', fontSize: '0.8rem' }}>Vai trò</span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {viewingUser.roles?.map((r) => (
                    <span key={r} className="admin-role-badge admin-role-badge--admin">{r}</span>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--admin-text-soft)', display: 'block', fontSize: '0.8rem' }}>Trạng thái tài khoản</span>
                <span
                  className={`admin-status-pill ${
                    viewingUser.status === 'ACTIVE'
                      ? 'admin-status-pill--active'
                      : viewingUser.status === 'LOCKED'
                      ? 'admin-status-pill--locked'
                      : 'admin-status-pill--pending'
                  }`}
                  style={{ marginTop: '4px' }}
                >
                  <span className="admin-status-dot" />
                  {viewingUser.status === 'ACTIVE'
                    ? 'Hoạt động'
                    : viewingUser.status === 'LOCKED'
                    ? 'Đã khóa'
                    : 'Chờ xác thực'}
                </span>
              </div>

              {viewingUser.createdAt && (
                <div>
                  <span style={{ color: 'var(--admin-text-soft)', display: 'block', fontSize: '0.8rem' }}>Ngày đăng ký</span>
                  <span>{new Date(viewingUser.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--admin-border-subtle)' }}>
              <button
                type="button"
                className="admin-btn-pill admin-btn-pill--ghost"
                onClick={() => setViewingUser(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="admin-btn-pill"
                style={{
                  backgroundColor: viewingUser.status === 'LOCKED' ? '#1E6B38' : '#B3261E',
                }}
                disabled={actionLoadingId === viewingUser.id}
                onClick={() => void handleToggleLock(viewingUser)}
              >
                {viewingUser.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}