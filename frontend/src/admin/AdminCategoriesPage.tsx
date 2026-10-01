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
        setNotice('Đã cập nhật danh mục.');
        setEditingCategory(null);
      } else {
        await createMutation.mutateAsync(payload);
        setNotice('Đã tạo danh mục.');
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
      setNotice('Đã xóa mềm danh mục. Các sản phẩm được giữ nguyên.');
      if (editingCategory?.id === category.id) setEditingCategory(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <section className="category-management" aria-labelledby="category-management-title">
      <header className="category-management__header">
        <div>
          <h1 id="category-management-title">Quản lý danh mục</h1>
          <p>Tạo và cập nhật danh mục sản phẩm. Xóa danh mục không xóa các sản phẩm liên quan.</p>
        </div>
      </header>

      {notice && <div role="status" className="category-notice">{notice}</div>}
      {error && <div role="alert" className="form-error-banner">{error}</div>}

      <div className="category-management__form">
        <h2>{editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}</h2>
        <CategoryForm
          key={editingCategory?.id ?? 'new-category'}
          category={editingCategory}
          isSubmitting={isSaving}
          onSubmit={handleSubmit}
          onCancel={editingCategory ? () => setEditingCategory(null) : undefined}
        />
      </div>

      <div className="category-management__list">
        <h2>Danh sách danh mục</h2>
        {categoriesQuery.isPending && <p role="status">Đang tải danh mục...</p>}
        {categoriesQuery.isError && (
          <div role="alert" className="form-error-banner">
            {getErrorMessage(categoriesQuery.error)}
            <button type="button" className="btn btn--ghost" onClick={() => void categoriesQuery.refetch()}>
              Thử lại
            </button>
          </div>
        )}
        {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
          <p>Chưa có danh mục nào.</p>
        )}
        {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
          <div className="category-table-wrap">
            <table className="category-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Slug</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categoriesQuery.data.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>{category.name}</strong>
                      {category.description && <small>{category.description}</small>}
                    </td>
                    <td>{category.slug}</td>
                    <td>{category.isDeleted ? 'Đã xóa' : 'Đang hoạt động'}</td>
                    <td className="category-table__actions">
                      {!category.isDeleted && (
                        <>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => {
                              setEditingCategory(category);
                              setNotice(null);
                              setError(null);
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger"
                            disabled={deleteMutation.isPending}
                            onClick={() => void handleDelete(category)}
                          >
                            Xóa
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
