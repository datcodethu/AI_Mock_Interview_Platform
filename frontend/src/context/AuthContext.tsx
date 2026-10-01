import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type {
  AuthUser,
  AuthenticationRequest,
  RegisterRequest,
  RegisterResponse,
  ChangePasswordRequest,
} from '../types/auth.types';
// AuthUser là kiểu dữ liệu FE decode ra từ accessToken (id, email, roles...) — không phải kiểu dữ liệu full user trong DB (có thể có thêm phone, avatarUrl...).
interface AuthContextValue {
  user: AuthUser | null; // null nếu chưa đăng nhập hoặc đã logout, hoặc token hết hạn (FE không decode được token) nếu đang login nhưng cookie refreshToken hết hạn. Nếu user !== null thì FE đã decode được token, có thể đọc được thông tin user (id, email, roles...) từ token.
  isAuthenticated: boolean;
  isLoading: boolean; // true trong lúc đang khôi phục phiên đăng nhập lúc app khởi động
  login: (payload: AuthenticationRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  verifyEmail: (token: string) => Promise<void>;
  changePassword: (payload: ChangePasswordRequest) => Promise<void>;
  logout: () => Promise<void>;
}

// The context must remain exported from this module for consumers; suppress the
// Fast Refresh rule for this intentionally shared non-component export.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chạy đúng 1 lần lúc app khởi động (F5 hoặc mở tab mới).
  // accessToken trong bộ nhớ đã mất, nhưng cookie refreshToken (httpOnly) vẫn còn
  // → authService.bootstrapSession() tự gọi /refresh-token bằng cookie đó để lấy lại phiên.
  useEffect(() => {
    async function bootstrap() {
      try {
        const restoredUser = await authService.bootstrapSession();
        setUser(restoredUser);
      } catch (error) {
        console.error('Không thể khôi phục phiên đăng nhập.', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  // Lắng nghe sự kiện "hết phiên" phát ra từ interceptor trong lib/axios.ts
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
    }
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  const login = useCallback(async (payload: AuthenticationRequest) => {
    const loggedInUser = await authService.login(payload);
    if (!loggedInUser) {
      // Server xác thực thành công nhưng FE không decode được token — lỗi bất thường,
      // không nên âm thầm coi như đăng nhập ok.
      throw new Error('Đăng nhập thành công nhưng không đọc được thông tin tài khoản.');
    }
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    return authService.register(payload);
    // Không tự động login sau register: tài khoản ở trạng thái PENDING_VERIFY,
    // backend từ chối login tới khi xác thực email — UI điều hướng sang "kiểm tra email".
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const verifiedUser = await authService.verifyEmail(token);
    setUser(verifiedUser);
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordRequest) => {
    await authService.changePassword(payload);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    verifyEmail,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}