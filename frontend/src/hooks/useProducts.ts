import { useCallback, useEffect, useState } from 'react';
import { productService } from '../services/productService';
import type { ProductFilterParams, ProductListItemResponse } from '../types/product.types';

/**
 * Custom hook quản lý dữ liệu danh sách sản phẩm công khai (Public Product List).
 * Quản lý trạng thái phân trang, lọc theo danh mục, khoảng giá, từ khóa tìm kiếm và sắp xếp.
 *
 * Pattern tương đồng với useAdminUsers.ts và useCategories.ts trong dự án.
 */
export function useProducts(initialParams: ProductFilterParams = { page: 0, size: 20 }) {
  const [products, setProducts] = useState<ProductListItemResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [params, setParams] = useState<ProductFilterParams>(initialParams);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await productService.listProducts(params);
      setProducts(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  // Tự động gọi lại API mỗi khi params thay đổi (chuyển trang, lọc danh mục, tìm kiếm...)
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    totalPages,
    totalElements,
    params,
    setParams,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}
