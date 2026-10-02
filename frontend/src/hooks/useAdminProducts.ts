import { useCallback, useEffect, useState } from 'react';
import { adminProductService } from '../services/adminProductService';
import { productService } from '../services/productService';
import type {
  CreateProductRequest,
  ProductDetailResponse,
  ProductFilterParams,
  ProductImageResponse,
  ProductListItemResponse,
  UpdateProductRequest,
} from '../types/product.types';

/**
 * Custom hook quản lý dữ liệu và các thao tác CRUD sản phẩm phía ADMIN.
 *
 * Pattern bám sát hoàn toàn theo hooks/useAdminUsers.ts:
 * - Tự động refetch sau mỗi thao tác (tạo, cập nhật, xóa, upload ảnh) để đảm bảo
 *   dữ liệu hiển thị trên bảng quản trị luôn phản ánh trạng thái mới nhất từ server,
 *   tránh tình trạng sai lệch state ở Client.
 */
export function useAdminProducts(initialParams: ProductFilterParams = { page: 0, size: 20 }) {
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
      setError('Không tải được danh sách sản phẩm quản trị');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(
    async (payload: CreateProductRequest): Promise<ProductDetailResponse> => {
      const created = await adminProductService.createProduct(payload);
      await fetchProducts();
      return created;
    },
    [fetchProducts]
  );

  const updateProduct = useCallback(
    async (id: string, payload: UpdateProductRequest): Promise<ProductDetailResponse> => {
      const updated = await adminProductService.updateProduct(id, payload);
      await fetchProducts();
      return updated;
    },
    [fetchProducts]
  );

  const deleteProduct = useCallback(
    async (id: string): Promise<void> => {
      await adminProductService.deleteProduct(id);
      await fetchProducts();
    },
    [fetchProducts]
  );

  const uploadImages = useCallback(
    async (productId: string, files: File[]): Promise<ProductImageResponse[]> => {
      const uploaded = await adminProductService.uploadImages(productId, files);
      await fetchProducts();
      return uploaded;
    },
    [fetchProducts]
  );

  return {
    products,
    totalPages,
    totalElements,
    params,
    setParams,
    isLoading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImages,
  };
}
