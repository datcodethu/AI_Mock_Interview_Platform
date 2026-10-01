// Lưu accessToken ở biến module-level (không phải React state) vì file axios.ts
// (nằm ngoài React) cũng cần đọc được để gắn header — Context chỉ đọc được trong component.
// Mất khi F5 trang — ĐÚNG Ý ĐỒ THIẾT KẾ, không phải bug (xem AuthContext.tsx: bootstrap
// sẽ tự gọi refresh-token để lấy lại access token mới từ cookie).
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Access token JWT gồm 3 phần cách nhau bởi dấu chấm: header.payload.signature
// Phần payload (giữa) chỉ encode base64, KHÔNG mã hoá — decode được ở FE mà không cần
// gọi thêm API nào, lấy luôn user info (email, roles, fullName) mà JwtService đã nhúng
// vào claim lúc tạo token (xem JwtService.generateToken()).
export function decodeAccessToken(token: string): {
  sub: string; // email — JwtService set bằng .subject(email)
  roles: string[];
  fullName: string;
  exp: number;
} | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch {
    // Token sai định dạng — không throw, để chỗ gọi tự xử lý như "không có user"
    return null;
  }
}