import { useCallback, useEffect, useState } from 'react';
import { userService } from '../services/userService';
import type { UserProfile, UpdateProfileRequest } from '../types/User.types';

/**
 * Tách hook riêng (không nhét vào AuthContext) vì lý do:
 * AuthContext chỉ cần biết "ai đang đăng nhập, roles gì" (đủ cho ProtectedRoute,
 * hiển thị avatar ở header...) — không cần load full profile (phone, avatarUrl...)
 * ngay lúc app khởi động. Trang Profile mới cần data đầy đủ này, nên tự fetch riêng
 * khi trang đó được mở — tránh gọi API thừa cho những trang không cần tới.
 */
export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getMyProfile();
      setProfile(data);
    } catch {
      setError('Không tải được thông tin tài khoản');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (payload: UpdateProfileRequest) => {
    // Không setIsLoading(true) ở đây — đây là hành động "lưu", không phải "tải trang",
    // UI nên dùng trạng thái riêng (isSubmitting) ở component, không dùng chung isLoading.
    const updated = await userService.updateMyProfile(payload);
    setProfile(updated); // cập nhật luôn state, không cần fetchProfile() gọi lại API thừa
    return updated;
  }, []);

  return { profile, isLoading, error, refetch: fetchProfile, updateProfile };
}