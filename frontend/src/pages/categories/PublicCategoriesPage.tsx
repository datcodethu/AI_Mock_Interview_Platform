import { Link } from 'react-router-dom';
import { CategoryCard } from '../../components/categories/CategoryCard';
import { CategoryQueryError } from '../../components/categories/CategoryQueryError';
import { useActiveCategories } from '../../hooks/useCategories';

export function PublicCategoriesPage() {
  const categoriesQuery = useActiveCategories();

  return (
    <section className="public-categories page-container" aria-labelledby="public-categories-title">
      <header className="public-categories__header">
        <p className="eyebrow">GIA LÊ GROUP · CỬA HÀNG</p>
        <h1 id="public-categories-title">Danh mục sản phẩm</h1>
        <p>Khám phá các danh mục nội thất và đồ dùng gia đình được tuyển chọn cho tổ ấm của bạn.</p>
      </header>

      {categoriesQuery.isPending && <p role="status">Đang tải danh mục...</p>}

      {categoriesQuery.isError && (
        <CategoryQueryError
          error={categoriesQuery.error}
          onRetry={() => void categoriesQuery.refetch()}
        />
      )}

      {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
        <div className="public-categories__empty">
          <h2>Danh mục đang được cập nhật</h2>
          <p>Hiện chưa có danh mục sản phẩm nào. Vui lòng quay lại sau.</p>
          <Link className="btn btn--primary" to="/">Về trang chủ</Link>
        </div>
      )}

      {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
        <div className="public-category-grid">
          {categoriesQuery.data.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}
