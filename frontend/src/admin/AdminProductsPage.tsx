import { useState } from 'react';
import { ProductForm } from '../components/products/ProductForm';
import { ProductImageUploadModal } from '../components/products/ProductImageUploadModal';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useActiveCategories } from '../hooks/useCategories';
import { productService } from '../services/productService';
import type {
  CreateProductRequest,
  ProductDetailResponse,
  ProductListItemResponse,
  UpdateProductRequest,
} from '../types/product.types';

export function AdminProductsPage() {
  const {
    products,
    totalPages,
    totalElements,
    params,
    setParams,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImages,
  } = useAdminProducts({ page: 0, size: 10, sort: 'newest' });

  const categoriesQuery = useActiveCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetailResponse | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState<ProductListItemResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentPage = params.page ?? 0;
  const currentSize = params.size ?? 10;

  async function handleOpenCreate() {
    setEditingProduct(null);
    setIsFormOpen(true);
    setNotice(null);
    setActionError(null);
  }

  async function handleOpenEdit(productItem: ProductListItemResponse) {
    setNotice(null);
    setActionError(null);
    try {
      const fullDetail = await productService.getProductBySlug(productItem.slug);
      setEditingProduct(fullDetail);
      setIsFormOpen(true);
    } catch {
      setActionError('Không tải được thông tin chi tiết sản phẩm để chỉnh sửa.');
    }
  }

  async function handleFormSubmit(payload: CreateProductRequest | UpdateProductRequest) {
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload as UpdateProductRequest);
        setNotice('Đã cập nhật sản phẩm thành công.');
      } else {
        await createProduct(payload as CreateProductRequest);
        setNotice('Đã tạo mới sản phẩm thành công.');
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Thao tác thất bại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(product: ProductListItemResponse) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mềm sản phẩm "${product.name}"?`)) {
      return;
    }
    setNotice(null);
    setActionError(null);
    try {
      await deleteProduct(product.id);
      setNotice(`Đã xóa mềm sản phẩm "${product.name}". Dữ liệu được bảo toàn trong database.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Xóa sản phẩm thất bại.');
      }
    }
  }

  async function handleUploadImages(productId: string, files: File[]) {
    setIsUploading(true);
    setActionError(null);
    try {
      await uploadImages(productId, files);
      setNotice('Đã tải lên danh sách ảnh sản phẩm thành công.');
      setUploadingProduct(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Upload ảnh thất bại.');
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="admin-page" aria-labelledby="admin-products-title">
      {/* HEADER */}
      <div className="admin-header">
        <div className="admin-header__title-group">
          <h1 id="admin-products-title">
            Quản lý sản phẩm
            {totalElements > 0 && (
              <span className="admin-header__badge-count">{totalElements} sản phẩm</span>
            )}
          </h1>
          <p>Danh mục hàng hóa, số lượng tồn kho, giá bán và hình ảnh thực tế.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="admin-page-btn"
          style={{
            height: '40px',
            padding: '0 20px',
            background: 'var(--clay)',
            borderColor: 'var(--clay)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 2px 6px rgba(163, 74, 40, 0.25)',
          }}
        >
          ➕ Thêm sản phẩm mới
        </button>
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

      {actionError && (
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
          <span>⚠ {actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* TOOLBAR TÌM KIẾM & BỘ LỌC */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <svg
            className="admin-search-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
            value={params.search ?? ''}
            onChange={(e) =>
              setParams((prev) => ({ ...prev, search: e.target.value || undefined, page: 0 }))
            }
            className="admin-search-input"
          />
        </div>

        <select
          value={params.categorySlug ?? ''}
          onChange={(e) =>
            setParams((prev) => ({ ...prev, categorySlug: e.target.value || undefined, page: 0 }))
          }
          className="admin-search-input"
          style={{ width: 'auto', minWidth: '180px', padding: '0 12px' }}
        >
          <option value="">Tất cả danh mục</option>
          {categoriesQuery.data?.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={params.sort ?? 'newest'}
          onChange={(e) =>
            setParams((prev) => ({ ...prev, sort: e.target.value || undefined, page: 0 }))
          }
          className="admin-search-input"
          style={{ width: 'auto', minWidth: '160px', padding: '0 12px' }}
        >
          <option value="newest">Mới nhất trước</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
        </select>

        <button
          type="button"
          onClick={() => setParams({ page: 0, size: 10, sort: 'newest' })}
          className="admin-page-btn"
          style={{ height: '38px', padding: '0 14px' }}
        >
          Đặt lại
        </button>
      </div>

      {/* TRẠNG THÁI LOADING / ERROR */}
      {isLoading && (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--ink-muted)' }}>
          Đang tải danh sách sản phẩm...
        </div>
      )}

      {error && (
        <div style={{ padding: '20px', color: 'var(--danger)', background: 'var(--danger-bg)', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      {/* BẢNG SẢN PHẨM */}
      {!isLoading && !error && products.length === 0 && (
        <div className="admin-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--forest)' }}>Không có sản phẩm nào</h3>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 16px' }}>
            Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="admin-page-btn"
            style={{ background: 'var(--clay)', color: '#fff', borderColor: 'var(--clay)', padding: '0 16px', height: '36px' }}
          >
            Thêm sản phẩm mới ngay
          </button>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && (
        <div className="admin-table-container">
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá niêm yết</th>
                  <th>Tồn kho</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dcd3c1' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                background: '#f2eee5',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                color: 'var(--ink-muted)',
                              }}
                            >
                              📦
                            </div>
                          )}
                          <div>
                            <strong style={{ display: 'block', color: 'var(--ink)' }}>{p.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                              SKU: <code>{p.sku}</code>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge">{p.categoryName || 'Chưa gán'}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--forest)' }}>
                          {p.price != null ? `${p.price.toLocaleString('vi-VN')} ₫` : 'Liên hệ'}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-pill ${p.inStock ? 'status-pill--active' : 'status-pill--locked'}`}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                          {p.inStock ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="admin-page-btn"
                            style={{ height: '30px', padding: '0 10px', fontSize: '0.78rem' }}
                            onClick={() => setUploadingProduct(p)}
                            title="Tải ảnh sản phẩm"
                          >
                            📷 Ảnh
                          </button>
                          <button
                            type="button"
                            className="admin-page-btn"
                            style={{ height: '30px', padding: '0 10px', fontSize: '0.78rem' }}
                            onClick={() => void handleOpenEdit(p)}
                            title="Chỉnh sửa sản phẩm"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-page-btn"
                            style={{
                              height: '30px',
                              padding: '0 10px',
                              fontSize: '0.78rem',
                              borderColor: '#922b21',
                              color: '#922b21',
                              background: '#fbeeed',
                            }}
                            onClick={() => void handleDelete(p)}
                            title="Xóa mềm sản phẩm"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PHÂN TRANG HIỆN ĐẠI */}
          <div className="admin-pagination">
            <div className="admin-pagination__info">
              Trang <strong>{currentPage + 1}</strong> / <strong>{Math.max(1, totalPages)}</strong>
              {totalElements > 0 && ` · Tổng số ${totalElements} sản phẩm`}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>Số dòng:</span>
                <select
                  value={currentSize}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, size: Number(e.target.value), page: 0 }))
                  }
                  className="admin-search-input"
                  style={{ height: '32px', padding: '0 8px', width: '70px' }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="admin-pagination__controls">
                <button
                  type="button"
                  disabled={currentPage <= 0}
                  onClick={() => setParams((prev) => ({ ...prev, page: currentPage - 1 }))}
                  className="admin-page-btn"
                  title="Trang trước"
                >
                  ← Trước
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i;
                  if (totalPages > 5 && currentPage > 2) {
                    pageNum = Math.min(currentPage - 2 + i, totalPages - 1);
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setParams((prev) => ({ ...prev, page: pageNum }))}
                      className={`admin-page-btn ${currentPage === pageNum ? 'is-active' : ''}`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setParams((prev) => ({ ...prev, page: currentPage + 1 }))}
                  className="admin-page-btn"
                  title="Trang sau"
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO / SỬA SẢN PHẨM */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="admin-card__header">
              <h2 className="admin-card__title">
                {editingProduct ? '✏️ Chỉnh sửa sản phẩm' : '➕ Tạo sản phẩm mới'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="admin-page-btn"
                style={{ height: '28px', width: '28px', padding: 0 }}
              >
                ✕
              </button>
            </div>
            <div className="admin-card__body">
              <ProductForm
                key={editingProduct?.id ?? 'new-product'}
                initialProduct={editingProduct}
                isSubmitting={isSubmitting}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD ẢNH */}
      {uploadingProduct && (
        <ProductImageUploadModal
          product={uploadingProduct}
          isUploading={isUploading}
          onClose={() => setUploadingProduct(null)}
          onUpload={handleUploadImages}
        />
      )}
    </section>
  );
}
