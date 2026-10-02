import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import type { ProductDetailResponse } from '../../types/product.types';

export function PublicProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    productService
      .getProductBySlug(slug)
      .then((data) => {
        if (isMounted) {
          setProduct(data);
          if (data.images && data.images.length > 0) {
            setSelectedImageUrl(data.images[0].url);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="page-container" style={{ paddingBlock: '60px', textAlign: 'center' }}>
        <p>Đang tải thông tin chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-container" style={{ paddingBlock: '60px' }}>
        <div className="public-category-detail__not-found">
          <h1>Sản phẩm không tồn tại</h1>
          <p>{error ?? 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'}</p>
          <Link to="/products" className="btn btn--primary">
            ← Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const formattedPrice =
    product.price != null
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.price))
      : 'Liên hệ báo giá';

  return (
    <div className="product-detail-page page-container">
      {/* Breadcrumb điều hướng */}
      <nav className="public-category-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/products">Sản phẩm</Link>
        {product.categorySlug && (
          <>
            <span>/</span>
            <Link to={`/categories/${product.categorySlug}`}>{product.categoryName}</Link>
          </>
        )}
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail-layout">
        {/* Gallery hình ảnh */}
        <div className="product-detail-gallery">
          <div className="product-detail-gallery__main">
            {selectedImageUrl ? (
              <img src={selectedImageUrl} alt={product.name} className="product-detail-image" />
            ) : (
              <div className="product-detail-placeholder">
                <span>{product.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="product-detail-gallery__thumbs">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageUrl(img.url)}
                  className={`product-thumb-btn ${selectedImageUrl === img.url ? 'is-active' : ''}`}
                >
                  <img src={img.url} alt={`Ảnh ${img.sortOrder}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm */}
        <div className="product-detail-info">
          <div className="product-card__meta">
            <span className="product-card__category">{product.categoryName}</span>
            <span className={`product-card__stock ${product.inStock ? 'is-in-stock' : 'is-out-of-stock'}`}>
              {product.inStock ? 'Còn hàng' : 'Tạm hết hàng'}
            </span>
          </div>

          <h1 className="product-detail-title">{product.name}</h1>

          <div className="product-detail-meta-row">
            <span className="product-detail-sku">Mã SKU: <strong>{product.sku}</strong></span>
          </div>

          <div className="product-detail-price-box">
            <span className="product-detail-price">{formattedPrice}</span>
          </div>

          {product.shortDescription && (
            <p className="product-detail-short-desc">{product.shortDescription}</p>
          )}

          <div className="product-detail-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!product.inStock}
              onClick={() => alert(`Đã thêm "${product.name}" vào giỏ hàng!`)}
            >
              {product.inStock ? 'Thêm vào giỏ hàng' : 'Tạm thời hết hàng'}
            </button>
            <Link to="/products" className="btn btn--ghost">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>

      {/* Mô tả chi tiết HTML (Đã qua Jsoup Safelist.relaxed() an toàn từ backend) */}
      {product.description && (
        <section className="product-detail-description">
          <h2>Mô tả chi tiết sản phẩm</h2>
          <div
            className="product-description-content"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}
    </div>
  );
}
