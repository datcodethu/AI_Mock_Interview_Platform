// Keep these API contracts aligned with the backend request and response DTOs.
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface RegisterRequest {
  email: string;
  phoneNumber: string;
  password: string;
  fullName: string;
}

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RegisterResponse {
  email: string;
  status: 'PENDING_VERIFY' | 'ACTIVE' | 'LOCKED';
  expiresAt: number;
}

export interface AuthenticationResponse {
  accessToken: string;
}

// Không có field "user" riêng trong response — thông tin user (email, roles, fullName)
// được decode trực tiếp từ accessToken ở FE (xem lib/tokenStore.ts → decodeAccessToken).
// Lý do: JwtService bên backend đã nhúng sẵn các claim này vào token lúc tạo,
// tận dụng luôn thay vì bắt backend trả thêm 1 object user() trùng lặp dữ liệu.

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}