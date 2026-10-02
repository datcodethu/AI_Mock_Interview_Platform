import { ProductCard } from '../../components/products/ProductCard';
import { ProductFilterBar } from '../../components/products/ProductFilterBar';
import { useProducts } from '../../hooks/useProducts';

export function PublicProductsPage() {
  const { products, totalPages, totalElements, params, setParams, isLoading, error, refetch } =
    useProducts({ page: 0, size: 12, sort: 'newest' });

  function handleFilterChange(newParams: Record<string, unknown>) {
    setParams((prev) => ({ ...prev, ...newParams }));
  }

  function handleReset() {
    setParams({ page: 0, size: 12, sort: 'newest' });
  }

  const currentPage = params.page ?? 0;

  return (
    <div className="public-products page-container">
      <header className="public-products__header">
        <p className="eyebrow">CỬA HÀNG TRỰC TUYẾN</p>
        <h1>Tất cả sản phẩm</h1>
        <p>Khám phá các sản phẩm chất lượng cao với mức giá ưu đãi nhất.</p>
      </header>

      <ProductFilterBar
        params={params}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {isLoading && (
        <div className="products-loading" role="status">
          <p>Đang tải danh sách sản phẩm...</p>
        </div>
      )}

      {error && (
        <div className="category-query-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn--ghost" onClick={() => refetch()}>
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="public-categories__empty">
          <h2>Không tìm thấy sản phẩm nào</h2>
          <p>Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt các bộ lọc.</p>
          <button type="button" className="btn btn--primary" onClick={handleReset}>
            Xem tất cả sản phẩm
          </button>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && (
        <>
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="products-pagination">
              <span className="products-pagination__info">
                Hiển thị {products.length} / {totalElements} sản phẩm
              </span>
              <div className="products-pagination__buttons">
                <button
                  type="button"
                  disabled={currentPage <= 0}
                  onClick={() => setParams((prev) => ({ ...prev, page: currentPage - 1 }))}
                  className="btn btn--ghost"
                >
                  ← Trang trước
                </button>
                <span className="products-pagination__current">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setParams((prev) => ({ ...prev, page: currentPage + 1 }))}
                  className="btn btn--ghost"
                >
                  Trang sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
