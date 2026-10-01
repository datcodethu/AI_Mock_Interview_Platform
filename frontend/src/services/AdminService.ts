import { apiClient } from '../lib/axios';
import type {
  ApiResponse,
  PageResponse,
  UserProfile,
  AdminUserListParams,
  UpdateUserRolesRequest,
} from '../types/User.types';

// Toàn bộ endpoint ở đây PHẢI nằm dưới /api/v1/admin/** ở backend (khớp rule
// hasRole("ADMIN") trong SecurityConfig — nhớ sửa rule đó thêm tiền tố /api/v1
// như đã lưu ý ở tin trước, nếu không những API này sẽ không được bảo vệ đúng).
export const adminService = {
  async listUsers(params: AdminUserListParams = {}): Promise<PageResponse<UserProfile>> {
    const res = await apiClient.get<ApiResponse<PageResponse<UserProfile>>>('/admin/users', {
      params, // axios tự bỏ qua field undefined (page/size/search không truyền), không cần lọc tay
    });
    return res.data.data;
  },

  async getUserById(id: string): Promise<UserProfile> {
    const res = await apiClient.get<ApiResponse<UserProfile>>(`/admin/users/${id}`);
    return res.data.data;
  },

  async lockUser(id: string): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/lock`);
  },

  async unlockUser(id: string): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/unlock`);
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },

  async updateUserRoles(id: string, payload: UpdateUserRolesRequest): Promise<UserProfile> {
    const res = await apiClient.put<ApiResponse<UserProfile>>(`/admin/users/${id}/roles`, payload);
    return res.data.data;
  },
};
