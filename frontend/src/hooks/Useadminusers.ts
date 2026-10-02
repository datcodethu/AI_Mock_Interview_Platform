import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/AdminService';
import type { AdminUserListParams, UserProfile } from '../types/User.types';

export function useAdminUsers(initialParams: AdminUserListParams = { page: 0, size: 20 }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [params, setParams] = useState<AdminUserListParams>(initialParams);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.listUsers(params);
      setUsers(result?.content ?? []);
      setTotalPages(result?.totalPages ?? 0);
      setTotalElements(result?.totalElements ?? 0);
    } catch {
      setError('Không tải được danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    totalElements,
    params,
    setParams,
    isLoading,
    error,
    refetch: fetchUsers,
    lockUser,
    unlockUser,
    deleteUser,
    updateUserRoles,
  };
}