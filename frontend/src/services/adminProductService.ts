import { apiClient } from '../lib/axios';
import type {
  ApiResponse,
  CreateProductRequest,
  ProductDetailResponse,
  ProductImageResponse,
  UpdateProductRequest,
} from '../types/product.types';

/**
 * Service quản trị sản phẩm dành cho ADMIN (/api/v1/admin/products/**).
 *
 * CÁC LƯU Ý BẢO MẬT & QUY TẮC BẮT BUỘC:
 * 1. DEFENSE-IN-DEPTH:
 *    - Toàn bộ endpoint yêu cầu token ADMIN, interceptor trong `lib/axios.ts` sẽ tự động đính kèm
 *      header Authorization: Bearer <accessToken>.
 *
 * 2. NGUYÊN TẮC UPLOAD ẢNH VỚI MULTIPART FORMDATA:
 *    - Khi upload file qua API `uploadImages`, dùng đối tượng `FormData`.
 *    - TUYỆT ĐỐI KHÔNG tự tay chỉ định header `Content-Type: 'multipart/form-data'` khi gọi Axios.
 *    - TẠI SAO: Trình duyệt và Axios cần tự động sinh giá trị header kèm theo chuỗi phân cách ngẫu nhiên (boundary),
 *      ví dụ: `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`.
 *      Nếu dev ghi đè thủ công `'multipart/form-data'` mà không có boundary, backend Spring Boot
 *      sẽ không thể phân tách các field và file, dẫn tới lỗi 400 Bad Request hoặc danh sách file rỗng.
 */
export const adminProductService = {
  /**
   * Tạo mới một sản phẩm.
   */
  async createProduct(payload: CreateProductRequest): Promise<ProductDetailResponse> {
    const res = await apiClient.post<ApiResponse<ProductDetailResponse>>('/admin/products', payload);
    return res.data.data;
  },

  /**
   * Cập nhật thông tin sản phẩm.
   */
  async updateProduct(id: string, payload: UpdateProductRequest): Promise<ProductDetailResponse> {
    const res = await apiClient.put<ApiResponse<ProductDetailResponse>>(`/admin/products/${id}`, payload);
    return res.data.data;
  },

  /**
   * Xóa mềm sản phẩm (soft delete).
   */
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`);
  },

  /**
   * Tải lên danh sách hình ảnh cho sản phẩm.
   *
   * @param productId ID sản phẩm cần bổ sung ảnh
   * @param files danh sách File đã chọn từ input file của trình duyệt
   */
  async uploadImages(productId: string, files: File[]): Promise<ProductImageResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      // Key "files" phải khớp chính xác với @RequestParam("files") trong AdminProductController của Spring Boot
      formData.append('files', file);
    });

    // QUAN TRỌNG: Xóa header 'Content-Type' mặc định ('application/json') từ Axios instance,
    // để trình duyệt tự do sinh header 'multipart/form-data; boundary=...' chính xác.
    const res = await apiClient.post<ApiResponse<ProductImageResponse[]>>(
      `/admin/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    );
    return res.data.data;
  },
};
