import axios from 'axios';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'Không thể tải danh mục. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
}

export function CategoryQueryError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="category-query-error">
      <p>{getErrorMessage(error)}</p>
      <button type="button" className="btn btn--ghost" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}
