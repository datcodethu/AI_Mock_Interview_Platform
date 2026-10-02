import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryCard } from '../../components/categories/CategoryCard';
import { ProductCard } from '../../components/products/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useActiveCategories } from '../../hooks/useCategories';
import { productService } from '../../services/productService';
import type { ProductListItemResponse } from '../../types/product.types';

export function HomePage() {
  const categoriesQuery = useActiveCategories();
  const [featuredProducts, setFeaturedProducts] = useState<ProductListItemResponse[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    productService
      .listProducts({ size: 4, sort: 'newest' })
      .then((res) => {
        if (isMounted) setFeaturedProducts(res.content);
      })
      .catch(() => {
        if (isMounted) setProductsError('Không thể tải danh sách sản phẩm nổi bật.');
      })
      .finally(() => {
        if (isMounted) setIsProductsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="home-hero">
        <div className="page-container home-hero__content">
          <span className="eyebrow">GIA LÊ GROUP · NỘI THẤT & PHONG CÁCH SỐNG</span>
          <h1>Không gian đẹp bắt đầu từ những lựa chọn phù hợp.</h1>
          <p>
            Tuyển chọn nội thất gia đình cao cấp, hài hòa giữa công năng hiện đại và vẻ đẹp trường tồn,
            kiến tạo tổ ấm an yên cho người Việt.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn--accent">
              Xem bộ sưu tập sản phẩm
            </Link>
            <Link to="/categories" className="btn btn--ghost">
              Khám phá danh mục
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Giá trị cốt lõi / Cam kết */}
      <section className="home-features page-container" style={{ paddingBlock: '48px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '12px' }} aria-hidden="true">
              ✨
            </span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Thiết kế tinh tuyển</h3>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
              Mỗi sản phẩm đều được chọn lọc kỹ lưỡng theo ngôn ngữ tối giản, bền vững và trường tồn cùng thời gian.
            </p>
          </div>

          <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '12px' }} aria-hidden="true">
              🌿
            </span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Vật liệu tự nhiên & an toàn</h3>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
              Sử dụng gỗ tự nhiên, bề mặt hoàn thiện thân thiện môi trường, an toàn cho trẻ nhỏ và sức khỏe gia đình.
            </p>
          </div>

          <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '12px' }} aria-hidden="true">
              🛡️
            </span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Chính sách hậu mãi tận tâm</h3>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
              Bảo hành chính hãng dài hạn, hỗ trợ tư vấn không gian và giao lắp trọn gói tận nhà.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Danh mục sản phẩm */}
      <section className="home-categories page-container" aria-labelledby="home-categories-title">
        <header className="home-categories__header">
          <div>
            <span className="eyebrow">DANH MỤC TUYỂN CHỌN</span>
            <h2 id="home-categories-title">Mua sắm theo danh mục</h2>
          </div>
          <Link to="/categories" style={{ color: 'var(--clay)', fontWeight: 500 }}>
            Xem tất cả danh mục
          </Link>
        </header>

        {categoriesQuery.isPending && <LoadingSpinner message="Đang tải danh mục..." />}
        {categoriesQuery.isError && (
          <ErrorState
            title="Không thể tải danh mục"
            message="Đã có lỗi khi kết nối tới máy chủ."
            onRetry={() => void categoriesQuery.refetch()}
          />
        )}
        {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
          <EmptyState
            title="Chưa có danh mục nào"
            description="Các danh mục sản phẩm sẽ sớm được cập nhật trên website."
          />
        )}
        {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
          <div className="public-category-grid public-category-grid--featured">
            {categoriesQuery.data.slice(0, 4).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Sản phẩm mới nhất */}
      <section className="home-products page-container" style={{ paddingBlock: '40px 72px' }}>
        <header className="home-categories__header">
          <div>
            <span className="eyebrow">BỘ SƯU TẬP MỚI</span>
            <h2>Sản phẩm nổi bật</h2>
          </div>
          <Link to="/products" style={{ color: 'var(--clay)', fontWeight: 500 }}>
            Xem tất cả sản phẩm
          </Link>
        </header>

        {isProductsLoading && <LoadingSpinner message="Đang tải sản phẩm mới nhất..." />}
        {productsError && (
          <ErrorState
            title="Lỗi tải sản phẩm"
            message={productsError}
            onRetry={() => window.location.reload()}
          />
        )}
        {!isProductsLoading && !productsError && featuredProducts.length === 0 && (
          <EmptyState
            title="Sản phẩm đang được cập nhật"
            description="Bộ sưu tập mới sẽ có mặt sớm nhất trong vài ngày tới."
          />
        )}
        {!isProductsLoading && !productsError && featuredProducts.length > 0 && (
          <div className="products-grid">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}