import { useEffect, useState } from 'react';
import { categoryService } from '../../services/categoryService';
import type { CategoryResponse } from '../../types/category.types';
import type { ProductFilterParams } from '../../types/product.types';

interface ProductFilterBarProps {
  params: ProductFilterParams;
  onFilterChange: (newParams: Partial<ProductFilterParams>) => void;
  onReset: () => void;
}

export function ProductFilterBar({ params, onFilterChange, onReset }: ProductFilterBarProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [searchInput, setSearchInput] = useState(params.search ?? '');

  useEffect(() => {
    let isMounted = true;
    categoryService
      .getActiveCategories()
      .then((data) => {
        if (isMounted) setCategories(data);
      })
      .catch(() => {
        // bỏ qua lỗi nếu không lấy được danh mục để không crash trang
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    onFilterChange({ search: searchInput.trim() || undefined, page: 0 });
  }

  return (
    <div className="product-filter-bar">
      <form className="product-filter-bar__search" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          placeholder="Tìm theo tên, mã SKU, mô tả..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="form-input"
        />
        <button type="submit" className="btn btn--primary">
          Tìm
        </button>
      </form>

      <div className="product-filter-bar__controls">
        {/* Lọc theo danh mục */}
        <select
          value={params.categorySlug ?? ''}
          onChange={(e) => onFilterChange({ categorySlug: e.target.value || undefined, page: 0 })}
          className="form-select"
          aria-label="Chọn danh mục"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Lọc theo sắp xếp */}
        <select
          value={params.sort ?? 'newest'}
          onChange={(e) => onFilterChange({ sort: e.target.value, page: 0 })}
          className="form-select"
          aria-label="Sắp xếp theo"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="name_asc">Tên A-Z</option>
          <option value="name_desc">Tên Z-A</option>
        </select>

        {/* Lọc theo khoảng giá */}
        <div className="product-filter-bar__price-group">
          <input
            type="number"
            min="0"
            step="10000"
            placeholder="Giá từ..."
            value={params.minPrice ?? ''}
            onChange={(e) =>
              onFilterChange({
                minPrice: e.target.value ? Number(e.target.value) : undefined,
                page: 0,
              })
            }
            className="form-input form-input--small"
            aria-label="Giá tối thiểu"
          />
          <span className="price-separator">-</span>
          <input
            type="number"
            min="0"
            step="10000"
            placeholder="Đến..."
            value={params.maxPrice ?? ''}
            onChange={(e) =>
              onFilterChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
                page: 0,
              })
            }
            className="form-input form-input--small"
            aria-label="Giá tối đa"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchInput('');
            onReset();
          }}
          className="btn btn--ghost"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
}
