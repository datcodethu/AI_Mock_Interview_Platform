

export interface AdminPaginationProps {
  currentPage: number; // 0-indexed (khớp Spring Data & params.page)
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  if (totalPages <= 0) return null;

  // Tính các số trang hiển thị dạng [1, 2, 3, '...', N]
  function generatePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i + 1);
      }
      return pages;
    }

    // Luôn có trang 1
    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 3);

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('...');
    }

    // Luôn có trang cuối
    pages.push(totalPages);

    return pages;
  }

  const pageNumbers = generatePages();

  // Tính số thứ tự hiển thị item hiện tại
  const startItem = totalElements ? currentPage * (pageSize || 10) + 1 : undefined;
  const endItem = totalElements
    ? Math.min(totalElements, (currentPage + 1) * (pageSize || 10))
    : undefined;

  return (
    <div className="admin-pagination-container">
      {/* Thông tin số lượng bản ghi */}
      <div className="admin-pagination-info">
        {totalElements !== undefined && startItem && endItem ? (
          <>
            Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trong tổng số{' '}
            <strong>{totalElements}</strong> mục
          </>
        ) : (
          <>
            Trang <strong>{currentPage + 1}</strong> / <strong>{totalPages}</strong>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Lựa chọn số dòng mỗi trang nếu có */}
        {pageSize && onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
            <span style={{ color: 'var(--admin-text-soft)' }}>Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="admin-table-filter"
              style={{ height: '32px', padding: '0 8px', fontSize: '0.84rem' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        {/* Nút phân trang dạng số và mũi tên ‹ › */}
        <div className="admin-pagination-pages">
          <button
            type="button"
            className="admin-pagination-btn"
            disabled={currentPage <= 0}
            onClick={() => onPageChange(currentPage - 1)}
            title="Trang trước"
            aria-label="Trang trước"
          >
            ‹
          </button>

          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{ padding: '0 6px', color: 'var(--admin-text-muted)' }}
                >
                  ...
                </span>
              );
            }

            const pageIndex = (p as number) - 1;
            const isActive = pageIndex === currentPage;

            return (
              <button
                key={`page-${p}`}
                type="button"
                className={`admin-pagination-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => onPageChange(pageIndex)}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            className="admin-pagination-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => onPageChange(currentPage + 1)}
            title="Trang sau"
            aria-label="Trang sau"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
