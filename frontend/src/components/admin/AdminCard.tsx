import type { ReactNode } from 'react';

export interface AdminCardAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}

export interface AdminCardProps {
  title: string;
  subtitle?: string;
  primaryAction?: AdminCardAction;
  secondaryAction?: AdminCardAction;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AdminCard({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  toolbar,
  children,
  className = '',
}: AdminCardProps) {
  return (
    <div className={`admin-card ${className}`}>
      {/* TẦNG 1: HEADER (Tiêu đề trang lớn bên trái + Nút hành động pill bên phải) */}
      <div className="admin-card__tier-header">
        <div className="admin-card__title-wrap">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {(primaryAction || secondaryAction) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="admin-btn-pill admin-btn-pill--ghost"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </button>
            )}

            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="admin-btn-pill"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* TẦNG 2: TOOLBAR (Chỉ xuất hiện nếu có toolbar: Tìm kiếm bên trái + Bộ lọc bên phải) */}
      {toolbar && <div className="admin-card__tier-toolbar">{toolbar}</div>}

      {/* NỘI DUNG CHÍNH (Bảng dữ liệu, biểu đồ, KPI...) */}
      <div className="admin-card__content">{children}</div>
    </div>
  );
}
