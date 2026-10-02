import { useState } from 'react';
import axios from 'axios';
import { CategoryForm } from '../components/categories/CategoryForm';
import type { CategoryFormValues } from '../components/categories/CategoryForm';
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/useCategories';
import type { CategoryResponse } from '../types/category.types';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'Không thể hoàn thành yêu cầu. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
}

export function AdminCategoriesPage() {
  const categoriesQuery = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(values: CategoryFormValues) {
    setNotice(null);
    setError(null);
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      iconUrl: values.iconUrl,
    };

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, payload });
        setNotice('Đã cập nhật danh mục thành công.');
        setEditingCategory(null);
      } else {
        await createMutation.mutateAsync(payload);
        setNotice('Đã tạo danh mục mới thành công.');
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleDelete(category: CategoryResponse) {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) return;
    setNotice(null);
    setError(null);
    try {
      await deleteMutation.mutateAsync(category.id);
      setNotice('Đã xóa mềm danh mục. Các sản phẩm thuộc danh mục vẫn được bảo toàn.');
      if (editingCategory?.id === category.id) setEditingCategory(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  const allCategories = categoriesQuery.data ?? [];
  const filteredCategories = allCategories.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <section className="admin-page" aria-labelledby="admin-category-title">
      {/* HEADER */}
      <div className="admin-header">
        <div className="admin-header__title-group">
          <h1 id="admin-category-title">
            Quản lý danh mục
            {allCategories.length > 0 && (
              <span className="admin-header__badge-count">{allCategories.length} danh mục</span>
            )}
          </h1>
          <p>Tạo và cập nhật cấu trúc phân loại sản phẩm cho toàn bộ sàn thương mại điện tử.</p>
        </div>
      </div>

      {/* THÔNG BÁO */}
      {notice && (
        <div
          role="status"
          style={{
            marginBottom: '18px',
            padding: '12px 18px',
            borderRadius: '6px',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '18px',
            padding: '12px 18px',
            borderRadius: '6px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠ {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* GRID FORM + DANH SÁCH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* CỘT FORM */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">
              {editingCategory ? '✏️ Chỉnh sửa danh mục' : '➕ Tạo danh mục mới'}
            </h2>
            {editingCategory && (
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="admin-page-btn"
                style={{ height: '28px', fontSize: '0.78rem' }}
              >
                Hủy sửa
              </button>
            )}
          </div>
          <div className="admin-card__body">
            <CategoryForm
              key={editingCategory?.id ?? 'new-category'}
              category={editingCategory}
              isSubmitting={isSaving}
              onSubmit={handleSubmit}
              onCancel={editingCategory ? () => setEditingCategory(null) : undefined}
            />
          </div>
        </div>

        {/* CỘT BẢNG DANH MỤC */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">Danh sách danh mục</h2>
            <div style={{ width: '220px' }}>
              <input
                type="search"
                placeholder="Lọc nhanh theo tên..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="admin-search-input"
                style={{ height: '32px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ padding: '0', overflowX: 'auto' }}>
            {categoriesQuery.isPending && (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                Đang tải danh mục...
              </div>
            )}

            {categoriesQuery.isError && (
              <div style={{ padding: '20px', color: 'var(--danger)' }}>
                {getErrorMessage(categoriesQuery.error)}
              </div>
            )}

            {categoriesQuery.isSuccess && filteredCategories.length === 0 && (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                Chưa có danh mục nào phù hợp.
              </div>
            )}

            {categoriesQuery.isSuccess && filteredCategories.length > 0 && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên danh mục</th>
                    <th>Slug</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <strong style={{ display: 'block', color: 'var(--ink)' }}>{cat.name}</strong>
                        {cat.description && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                            {cat.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', background: '#f2eee5', padding: '2px 6px', borderRadius: '4px' }}>
                          {cat.slug}
                        </code>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            cat.isDeleted ? 'status-pill--locked' : 'status-pill--active'
                          }`}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                          {cat.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {!cat.isDeleted && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="admin-page-btn"
                              style={{ height: '30px', padding: '0 10px', fontSize: '0.8rem' }}
                              onClick={() => {
                                setEditingCategory(cat);
                                setNotice(null);
                                setError(null);
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="admin-page-btn"
                              style={{
                                height: '30px',
                                padding: '0 10px',
                                fontSize: '0.8rem',
                                borderColor: '#922b21',
                                color: '#922b21',
                                background: '#fbeeed',
                              }}
                              disabled={deleteMutation.isPending}
                              onClick={() => void handleDelete(cat)}
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
