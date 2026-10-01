import { Link } from 'react-router-dom';
import { CategoryCard } from '../../components/categories/CategoryCard';
import { CategoryQueryError } from '../../components/categories/CategoryQueryError';
import { useActiveCategories } from '../../hooks/useCategories';

export function HomePage() {
  const categoriesQuery = useActiveCategories();

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="page-container home-hero__content">
          <p className="eyebrow">GIA LÊ GROUP · CHĂM CHÚT TỔ ẤM</p>
          <h1>Không gian đẹp bắt đầu từ những lựa chọn phù hợp.</h1>
          <p>Khám phá nội thất và đồ dùng gia đình được chọn lọc cho cuộc sống mỗi ngày.</p>
          <Link to="/categories" className="btn btn--primary">Khám phá danh mục</Link>
        </div>
      </section>

      <section className="home-categories page-container" aria-labelledby="home-categories-title">
        <header className="home-categories__header">
          <div>
            <p className="eyebrow">TÌM CẢM HỨNG</p>
            <h2 id="home-categories-title">Mua sắm theo danh mục</h2>
          </div>
          <Link to="/categories">Xem tất cả danh mục →</Link>
        </header>

        {categoriesQuery.isPending && <p role="status">Đang tải danh mục...</p>}
        {categoriesQuery.isError && (
          <CategoryQueryError
            error={categoriesQuery.error}
            onRetry={() => void categoriesQuery.refetch()}
          />
        )}
        {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
          <p>Danh mục sản phẩm sẽ sớm được cập nhật.</p>
        )}
        {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
          <div className="public-category-grid public-category-grid--featured">
            {categoriesQuery.data.slice(0, 4).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}