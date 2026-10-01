import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/AdminService';
import type { AdminUserListParams, UserProfile } from '../types/User.types';

export function useAdminUsers(initialParams: AdminUserListParams = { page: 0, size: 20 }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [params, setParams] = useState<AdminUserListParams>(initialParams);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.listUsers(params);
      setUsers(result.content);
      setTotalPages(result.totalPages);
    } catch {
      setError('Không tải được danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  // Chạy lại mỗi khi params đổi (đổi trang, gõ tìm kiếm, chọn filter status/role)
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 4 hành động dưới đây đều gọi lại fetchUsers() sau khi thành công, để danh sách
  // hiển thị luôn cập nhật đúng trạng thái mới nhất — tránh tình trạng UI hiển thị
  // "đã khoá" nhưng thật ra do state cũ, không phải data thật từ server.
  const lockUser = useCallback(async (id: string) => {
    await adminService.lockUser(id);
    await fetchUsers();
  }, [fetchUsers]);

  const unlockUser = useCallback(async (id: string) => {
    await adminService.unlockUser(id);
    await fetchUsers();
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: string) => {
    await adminService.deleteUser(id);
    await fetchUsers();
  }, [fetchUsers]);

  const updateUserRoles = useCallback(async (id: string, roles: string[]) => {
    await adminService.updateUserRoles(id, { roles });
    await fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    totalPages,
    params,
    setParams, // component gọi setParams({ ...params, page: 1 }) khi đổi trang, v.v.
    isLoading,
    error,
    refetch: fetchUsers,
    lockUser,
    unlockUser,
    deleteUser,
    updateUserRoles,
  };
}