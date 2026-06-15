package org.example.ai_mock_interview_platform.common.utils;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // KHÔNG XÁC ĐỊNH
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    UNKNOWN_ERROR(9999, "Đã xảy ra lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // USER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    USER_NOT_FOUND(1001, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(1002, "Người dùng đã tồn tại", HttpStatus.CONFLICT),
    EMAIL_ALREADY_EXISTS(1003, "Email đã được sử dụng", HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS(1004, "Username đã được sử dụng", HttpStatus.CONFLICT),
    USER_DISABLED(1005, "Tài khoản đã bị vô hiệu hóa", HttpStatus.FORBIDDEN),
    USER_BANNED(1006, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AUTHENTICATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    INVALID_CREDENTIALS(2001, "Email hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(2002, "Token không hợp lệ", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(2003, "Token đã hết hạn", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_INVALID(2004, "Refresh token không hợp lệ", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_EXPIRED(2005, "Refresh token đã hết hạn, vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REVOKED(2006, "Refresh token đã bị thu hồi", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_VERIFIED(2007, "Email chưa được xác thực", HttpStatus.FORBIDDEN),
    VERIFY_TOKEN_INVALID(2008, "Token xác thực không hợp lệ", HttpStatus.BAD_REQUEST),
    VERIFY_TOKEN_EXPIRED(2009, "Token xác thực đã hết hạn", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(2010, "Bạn không có quyền truy cập", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(2011, "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    ;

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}