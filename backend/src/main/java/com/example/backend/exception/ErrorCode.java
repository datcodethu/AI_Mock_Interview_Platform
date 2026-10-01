package com.example.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),


    // ===== Bổ sung cho Authentication flow =====
    EMAIL_EXISTED(1009, "Email or phone number already in use", HttpStatus.CONFLICT),
    ROLE_NOT_FOUND(1010, "Default role not found, please contact admin", HttpStatus.INTERNAL_SERVER_ERROR),
    WRONG_CREDENTIALS(1011, "Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    ACCOUNT_NOT_VERIFIED(1012, "Tài khoản chưa được xác thực email", HttpStatus.FORBIDDEN),
    ACCOUNT_LOCKED(1013, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
    ACCOUNT_INVALID_STATUS(1014, "Trạng thái tài khoản không hợp lệ", HttpStatus.FORBIDDEN),
    VERIFY_TOKEN_INVALID(1015, "Verification token is invalid", HttpStatus.BAD_REQUEST),
    VERIFY_TOKEN_EXPIRED(1016, "Verification token has expired", HttpStatus.BAD_REQUEST),
    ACCOUNT_ALREADY_VERIFIED(1017, "Account has already been verified", HttpStatus.BAD_REQUEST),
    // ===== Bổ sung cho JWT =====
    TOKEN_INVALID(1018, "Invalid token signature", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(1019, "Token has expired", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID_ISSUER(1020, "Invalid token issuer", HttpStatus.UNAUTHORIZED),
    TOKEN_REVOKED(1021, "Token has been revoked", HttpStatus.UNAUTHORIZED),
    TOKEN_TYPE_MISMATCH(1022, "Token type is not valid for this operation", HttpStatus.UNAUTHORIZED),
    RESET_TOKEN_INVALID(1023, "Reset password token is invalid", HttpStatus.BAD_REQUEST),
    RESET_TOKEN_EXPIRED(1024, "Reset password token has expired", HttpStatus.BAD_REQUEST),
    PASSWORD_MISMATCH(1025, "New password confirmation does not match", HttpStatus.BAD_REQUEST),
    VERIFICATION_EMAIL_FAILED(1026, "Không gửi được email xác thực. Vui lòng thử lại sau.", HttpStatus.INTERNAL_SERVER_ERROR),
    CATEGORY_NOT_FOUND(1027, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_SLUG_EXISTED(1028, "Category slug already exists", HttpStatus.CONFLICT),
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}