interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Đang tải dữ liệu...' }: LoadingSpinnerProps) {
  return (
    <div className="state-box" role="status">
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--forest)',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 0.8s linear infinite',
        }}
        aria-hidden="true"
      />
      <p style={{ margin: 0 }}>{message}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
