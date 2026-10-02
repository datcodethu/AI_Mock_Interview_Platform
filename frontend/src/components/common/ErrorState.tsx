interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được dữ liệu vào lúc này. Vui lòng thử lại sau ít phút.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-box" role="alert" style={{ borderColor: 'var(--danger-border)' }}>
      <div className="state-box__icon" style={{ color: 'var(--danger)' }} aria-hidden="true">
        ⚠️
      </div>
      <h3 style={{ color: 'var(--danger)' }}>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn--ghost">
          Thử lại
        </button>
      )}
    </div>
  );
}
