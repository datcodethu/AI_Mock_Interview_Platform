import { apiClient } from '../lib/axios';
import type {
  ApiResponse,
  PageResponse,
  ProductDetailResponse,
  ProductFilterParams,
  ProductListItemResponse,
} from '../types/product.types';

/**
 * Service gọi các API sản phẩm công khai (Public Endpoints).
 * Khách truy cập hoặc người dùng không cần đăng nhập vẫn có thể xem danh sách và chi tiết.
 */
export const productService = {
  /**
   * Lấy danh sách sản phẩm có phân trang và bộ lọc (danh mục, từ khóa, khoảng giá, sắp xếp).
   */
  async listProducts(params: ProductFilterParams = {}): Promise<PageResponse<ProductListItemResponse>> {
    const res = await apiClient.get<ApiResponse<PageResponse<ProductListItemResponse>>>('/products', {
      params, // Axios tự động bỏ qua các trường undefined trong query param
    });
    return res.data.data;
  },

  /**
   * Lấy thông tin chi tiết một sản phẩm theo đường dẫn thân thiện (slug).
   */
  async getProductBySlug(slug: string): Promise<ProductDetailResponse> {
    const res = await apiClient.get<ApiResponse<ProductDetailResponse>>(`/products/${slug}`);
    return res.data.data;
  },
};
