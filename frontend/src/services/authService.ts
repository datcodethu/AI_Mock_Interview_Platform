import axios from 'axios';
import { apiClient } from '../lib/axios';
import { setAccessToken, decodeAccessToken } from '../lib/tokenStore';
import type {
  ApiResponse,
  AuthenticationRequest,
  AuthenticationResponse,
  RegisterRequest,
  RegisterResponse,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AuthUser,
} from '../types/auth.types';

// Nguyên tắc: Service layer CHỈ lo việc gọi API + trả data, không điều hướng,
// không quản lý state React — để có thể tái sử dụng ở bất kỳ đâu (component, hook, test).

// accessToken hợp lệ nhưng decode ra null (sai định dạng) → coi như không có user,
// tránh cả app crash vì 1 token lỗi.
function toAuthUser(accessToken: string): AuthUser | null {
  const claims = decodeAccessToken(accessToken);
  if (!claims) return null;
  return {
    id: claims.sub,
    email: claims.sub, // JwtService set subject = email, không có field id riêng trong claim
    fullName: claims.fullName,
    roles: claims.roles,
  };
}

let bootstrapSessionPromise: Promise<AuthUser | null> | null = null;

export const authService = {
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const res = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: AuthenticationRequest): Promise<AuthUser | null> {
    const res = await apiClient.post<ApiResponse<AuthenticationResponse>>('/auth/login', payload);
    const { accessToken } = res.data.data;
    setAccessToken(accessToken); // lưu vào bộ nhớ — request interceptor sẽ tự dùng
    return toAuthUser(accessToken);
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      setAccessToken(null); // xoá dù API lỗi, tránh UI kẹt ở trạng thái "vẫn đăng nhập"
    }
  },

  async verifyEmail(token: string): Promise<AuthUser> {
    const res = await apiClient.get<ApiResponse<AuthenticationResponse>>('/auth/verify', {
      params: { token },
    });
    const { accessToken } = res.data.data;
    setAccessToken(accessToken);
    const user = toAuthUser(accessToken);
    if (!user) {
      setAccessToken(null);
      throw new Error('Email đã xác thực nhưng không đọc được thông tin tài khoản.');
    }
    return user;
  },

  async resendVerification(email: string): Promise<number> {
    const res = await apiClient.post<ApiResponse<number>>('/auth/resend-verification', null, {
      params: { email },
    });
    return res.data.data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', payload);
    setAccessToken(null);
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', null, { params: { email } });
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', payload);
  },

  /**
   * Gọi lúc app khởi động (F5 trang) để khôi phục phiên đăng nhập.
   * accessToken trong bộ nhớ đã mất sau F5, nhưng cookie refreshToken (httpOnly)
   * vẫn còn trong trình duyệt → xin lại access token mới bằng chính cookie đó,
   * không cần thêm endpoint /auth/me riêng vì user info decode thẳng từ token.
   * Trả về null (không throw) nếu cookie không có/hết hạn — đây là trường hợp
   * bình thường (user chưa đăng nhập), không phải lỗi.
   */
  async bootstrapSession(): Promise<AuthUser | null> {
    if (bootstrapSessionPromise) return bootstrapSessionPromise;

    bootstrapSessionPromise = (async () => {
      try {
        const res = await apiClient.post<ApiResponse<AuthenticationResponse>>('/auth/refresh-token', {});
        const { accessToken } = res.data.data;
        setAccessToken(accessToken);
        return toAuthUser(accessToken);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    })();

    try {
      return await bootstrapSessionPromise;
    } finally {
      bootstrapSessionPromise = null;
    }
  },
};