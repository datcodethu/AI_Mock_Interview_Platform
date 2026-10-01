import { apiClient } from '../lib/axios';
import type { ApiResponse, UserProfile, UpdateProfileRequest } from '../types/User.types';

// Endpoint đề xuất — backend cần thêm UserController với 2 route này,
// bảo vệ bằng .anyRequest().authenticated() (đã có sẵn trong SecurityConfig,
// không cần thêm rule riêng vì không phải route admin-only).
export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
    return res.data.data;
  },

  async updateMyProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    const res = await apiClient.put<ApiResponse<UserProfile>>('/users/me', payload);
    return res.data.data;
  },
};