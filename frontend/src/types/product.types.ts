import type { ApiResponse } from './auth.types';
import type { PageResponse } from './User.types';

export type { ApiResponse, PageResponse };

/**
 * Thông tin ảnh của sản phẩm.
 */
export interface ProductImageResponse {
  id: string;
  url: string;
  sortOrder: number;
}

/**
 * Response gọn nhẹ cho danh sách sản phẩm (GET /api/v1/products).
 * Không có trường `description` (HTML dài) để tối ưu băng thông và tốc độ tải trang.
 */
export interface ProductListItemResponse {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  shortDescription?: string | null;
  price?: number | null; // null mang ý nghĩa "liên hệ báo giá"
  sku: string;
  inStock: boolean;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response chi tiết đầy đủ của sản phẩm (GET /api/v1/products/{slug}, POST, PUT).
 * Bao gồm mô tả HTML đã được sanitize bằng Jsoup và danh sách toàn bộ ảnh.
 */
export interface ProductDetailResponse {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  shortDescription?: string | null;
  description?: string | null; // HTML an toàn
  price?: number | null;        // null mang ý nghĩa "liên hệ báo giá"
  sku: string;
  inStock: boolean;
  images: ProductImageResponse[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

/**
 * Tham số query lọc và phân trang cho API danh sách sản phẩm.
 */
export interface ProductFilterParams {
  page?: number;
  size?: number;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | string;
}

/**
 * Payload tạo mới sản phẩm (Dành cho ADMIN).
 */
export interface CreateProductRequest {
  name: string;
  slug: string;
  categoryId: string;
  shortDescription?: string;
  description?: string;
  price?: number | null;
  sku: string;
  inStock?: boolean;
}

/**
 * Payload cập nhật sản phẩm (Dành cho ADMIN).
 */
export interface UpdateProductRequest {
  name: string;
  slug: string;
  categoryId: string;
  shortDescription?: string;
  description?: string;
  price?: number | null;
  sku: string;
  inStock?: boolean;
}
