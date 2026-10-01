/**
 * Backend chưa có Controller cho User/Admin — các field dưới đây là ĐỀ XUẤT theo
 * đúng convention đang dùng ở AuthenticationController (ApiResponse<T> wrapper,
 * prefix /api/v1). Khi code Controller/DTO thật ở backend, đối chiếu lại field
 * name cho khớp 100%, tương tự việc từng làm với auth.types.ts.
 */

// ---- Dùng lại wrapper chung — nếu đã import từ auth.types.ts ở nơi khác thì
// dùng luôn từ đó, khai báo lại ở đây chỉ để file này độc lập, dễ đọc riêng lẻ.
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Convention phổ biến của Spring Data khi trả danh sách có phân trang
// (khớp với Page<T> của Spring nếu bạn dùng PageRequest ở Repository).
export interface PageResponse<T> {
  content: T[];
  page: number;       // trang hiện tại, bắt đầu từ 0
  size: number;        // số item mỗi trang
  totalElements: number;
  totalPages: number;
}

// =========================================================
// USER — profile của chính người dùng đang đăng nhập
// =========================================================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];
  status: 'PENDING_VERIFY' | 'ACTIVE' | 'LOCKED';
  createdAt: string; // ISO date string
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

// =========================================================
// ADMIN — quản lý danh sách toàn bộ user
// =========================================================

// Dùng chung UserProfile cho item trong danh sách admin xem — nếu backend cần
// admin thấy thêm field mà user thường không thấy (VD lastLoginAt), tách riêng
// AdminUserView extends UserProfile thay vì sửa UserProfile chung.
export interface AdminUserListParams {
  page?: number;
  size?: number;
  search?: string;          // tìm theo email/fullName
  status?: UserProfile['status'];
  role?: string;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}