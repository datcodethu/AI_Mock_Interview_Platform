import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Tách hook ra file riêng (thay vì export chung trong AuthContext.tsx) vì lý do kỹ thuật:
 * React Fast Refresh (HMR) hoạt động ổn định hơn khi 1 file .tsx chỉ export component,
 * không export lẫn cả hook/hàm thường. Đây là quy ước phổ biến trong codebase production.
 */
export function useAuth() {
  const context = useContext(AuthContext); // ý nghĩa của đoạn này là: lấy giá trị context hiện tại từ AuthContext. Nếu component đang sử dụng hook này nằm trong <AuthProvider>, context sẽ chứa giá trị của AuthContextValue (bao gồm user, isAuthenticated, isLoading, login, register, logout). Nếu không nằm trong <AuthProvider>, context sẽ là undefined.
  if (context === undefined) {
    // Lỗi này CỐ Ý throw ngay lúc dev code sai (quên bọc <AuthProvider>),
    // thay vì để lỗi âm thầm (context = undefined) rồi crash khó hiểu ở chỗ khác.
    throw new Error('useAuth() phải được gọi bên trong <AuthProvider>. Kiểm tra lại App.tsx.');
  }
  return context;
}