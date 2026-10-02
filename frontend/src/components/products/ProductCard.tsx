import { Link } from 'react-router-dom';
import type { ProductListItemResponse } from '../../types/product.types';

interface ProductCardProps {
  product: ProductListItemResponse;
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice =
    product.price != null
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.price))
      : 'Liên hệ báo giá';

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card__thumb-link">
        {product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt={product.name} className="product-card__image" loading="lazy" />
        ) : (
          <div className="product-card__placeholder">
            <span>{product.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__category">{product.categoryName || 'Sản phẩm'}</span>
          <span className={`product-card__stock ${product.inStock ? 'is-in-stock' : 'is-out-of-stock'}`}>
            {product.inStock ? 'Còn hàng' : 'Tạm hết'}
          </span>
        </div>

        <h3 className="product-card__title">
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {product.shortDescription && (
          <p className="product-card__short-desc">{product.shortDescription}</p>
        )}

        <div className="product-card__footer">
          <span className="product-card__price">{formattedPrice}</span>
          <span className="product-card__sku">SKU: {product.sku}</span>
        </div>
      </div>
    </article>
  );
}
