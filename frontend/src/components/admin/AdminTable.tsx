import { useState, type ReactNode } from 'react';

export interface AdminTableColumn<T> {
  header: string;
  key?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T) => ReactNode;
}

export interface AdminTableAction<T> {
  label: string;
  danger?: boolean;
  onClick: (item: T) => void;
}

export interface AdminTableProps<T extends { id: string }> {
  columns: AdminTableColumn<T>[];
  data: T[];
  selectedIds?: string[];
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onViewDetail?: (item: T) => void;
  moreActions?: AdminTableAction<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  data,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onViewDetail,
  moreActions,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu hiển thị.',
}: AdminTableProps<T>) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className="admin-table-wrap">
      <table className="admin-data-table">
        <thead>
          <tr>
            {/* Cột 1: Checkbox chọn hàng loạt */}
            {onSelectAll && (
              <th style={{ width: '48px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="Chọn tất cả hàng"
                />
              </th>
            )}

            {/* Các cột dữ liệu */}
            {columns.map((col, index) => (
              <th
                key={col.key || `col-${index}`}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
              >
                {col.header}
              </th>
            ))}

            {/* Cột cuối: Action (Chỉ icon con mắt và menu ba chấm) */}
            {(onViewDetail || (moreActions && moreActions.length > 0)) && (
              <th style={{ width: '90px', textAlign: 'right', paddingRight: '20px' }}>
                Thao tác
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {/* Trạng thái Loading */}
          {isLoading && (
            <tr>
              <td
                colSpan={columns.length + (onSelectAll ? 1 : 0) + 1}
                style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--admin-text-muted)' }}
              >
                Đang tải dữ liệu...
              </td>
            </tr>
          )}

          {/* Trạng thái Rỗng */}
          {!isLoading && data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (onSelectAll ? 1 : 0) + 1}
                style={{ textAlign: 'center', padding: '52px 16px', color: 'var(--admin-text-muted)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {/* Danh sách dữ liệu Airy */}
          {!isLoading &&
            data.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isMenuOpen = openMenuId === item.id;

              return (
                <tr key={item.id} className={isSelected ? 'is-selected' : ''}>
                  {/* Checkbox từng dòng */}
                  {onSelectRow && (
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectRow(item.id, e.target.checked)}
                        aria-label={`Chọn mục ${item.id}`}
                      />
                    </td>
                  )}

                  {/* Nội dung các cột */}
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key || `cell-${colIndex}`}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render(item)}
                    </td>
                  ))}

                  {/* Cột Action: CHỈ 1 icon con mắt xem chi tiết + menu '...' */}
                  {(onViewDetail || (moreActions && moreActions.length > 0)) && (
                    <td style={{ textAlign: 'right', paddingRight: '20px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {/* Icon con mắt xem chi tiết */}
                        {onViewDetail && (
                          <button
                            type="button"
                            className="admin-action-btn"
                            title="Xem chi tiết"
                            aria-label="Xem chi tiết"
                            onClick={() => onViewDetail(item)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        )}

                        {/* Menu ba chấm '...' cho các thao tác phụ (sửa/khóa/xóa) */}
                        {moreActions && moreActions.length > 0 && (
                          <div className="admin-action-menu-wrap">
                            <button
                              type="button"
                              className="admin-action-btn"
                              title="Tùy chọn khác"
                              aria-label="Tùy chọn khác"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="currentColor"
                              >
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                              </svg>
                            </button>

                            {isMenuOpen && (
                              <>
                                <div
                                  style={{ position: 'fixed', inset: 0, zIndex: 65 }}
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div
                                  className="sellzy-topbar__dropdown"
                                  style={{ top: '100%', right: 0, minWidth: '160px', zIndex: 70 }}
                                >
                                  {moreActions.map((action, aIdx) => (
                                    <button
                                      key={`action-${aIdx}`}
                                      type="button"
                                      className={`sellzy-topbar__dropdown-item ${
                                        action.danger ? 'sellzy-topbar__dropdown-item--danger' : ''
                                      }`}
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        action.onClick(item);
                                      }}
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
