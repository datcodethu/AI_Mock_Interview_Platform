package com.example.backend.controller;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.AuthenticationResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

        private final AuthenticationService authenticationService;

        @Value("${app.auth.cookie-secure:true}")
        private boolean secureCookies;

        // =========================
        // REGISTER
        // =========================
        @PostMapping("/register")
        public ResponseEntity<ApiResponse<RegisterResponse>> register(
                        @Valid @RequestBody RegisterRequest request) {
                RegisterResponse response = authenticationService.register(request);
                ApiResponse<RegisterResponse> body = ApiResponse.<RegisterResponse>builder()
                                .data(response)
                                .code(201)
                                .message("Success")
                                .build();
                return ResponseEntity.status(HttpStatus.CREATED).body(body);
        }

        // =========================
        // LOGIN
        // Đăng nhập bằng email + password, trả accessToken trong JSON,
        // refreshToken được set vào httpOnly cookie — không xuất hiện trong JSON.
        // =========================
        @PostMapping("/login")
        public ApiResponse<AuthenticationResponse> login(
                        @Valid @RequestBody AuthenticationRequest request,
                        HttpServletResponse response) {

                AuthenticationResponse result = authenticationService.login(request);

                setRefreshTokenCookie(response, result.getRefreshToken());
                result.setRefreshToken(null); // không trả refreshToken ra JSON

                return ApiResponse.<AuthenticationResponse>builder()
                                .data(result)
                                .code(200)
                                .message("Success")
                                .build();
        }

        // =========================
        // REFRESH TOKEN
        // Không nhận request body nữa — refreshToken đọc thẳng từ cookie.
        // Refresh token rotation: cấp lại cookie MỚI thay cho cookie cũ.
        // =========================
        @PostMapping("/refresh-token")
        public ApiResponse<AuthenticationResponse> refreshToken(
                        @CookieValue(name = "refreshToken", required = false) String refreshToken,
                        HttpServletResponse response) throws ParseException, JOSEException {

                // Sửa: throw khi refreshToken là null (THIẾU cookie) — trước đây bị viết ngược
                // lại.
                if (refreshToken == null) {
                        throw new AppException(ErrorCode.TOKEN_INVALID);
                }

                AuthenticationResponse result = authenticationService.refreshToken(refreshToken);

                setRefreshTokenCookie(response, result.getRefreshToken());
                result.setRefreshToken(null);

                return ApiResponse.<AuthenticationResponse>builder()
                                .data(result)
                                .code(200)
                                .message("Success")
                                .build();
        }

        // =========================
        // VERIFY EMAIL
        // =========================
        @GetMapping("/verify")
        public ApiResponse<AuthenticationResponse> verifyEmail(
                        @RequestParam String token,
                        HttpServletResponse response) {
                AuthenticationResponse result = authenticationService.verifyEmail(token);
                setRefreshTokenCookie(response, result.getRefreshToken());
                result.setRefreshToken(null);
                return ApiResponse.<AuthenticationResponse>builder()
                                .data(result)
                                .code(200)
                                .message("Email verified and signed in successfully")
                                .build();
        }

        // =========================
        // RESEND VERIFICATION EMAIL
        // =========================
        @PostMapping("/resend-verification")
        public ApiResponse<Long> resendVerification(@RequestParam String email) {
                long expiresAt = authenticationService.resendVerificationEmail(email);
                return ApiResponse.<Long>builder()
                                .data(expiresAt)
                                .code(200)
                                .message("Verification email resent")
                                .build();
        }

        // =========================
        // LOGOUT
        // Không còn đòi FE gửi accessToken/refreshToken trong body:
        // - accessToken lấy thẳng từ header Authorization của chính request này
        // - refreshToken lấy từ cookie
        // Cả 2 đều optional (không throw nếu thiếu/hết hạn) — logout nên LUÔN thành
        // công
        // từ góc nhìn của user, dù token có sao đi nữa; mục tiêu chính là xoá cookie.
        // =========================
        @PostMapping("/logout")
        public ApiResponse<Void> logout(
                        HttpServletRequest httpRequest,
                        @CookieValue(name = "refreshToken", required = false) String refreshToken,
                        HttpServletResponse response) {

                String accessToken = extractBearerToken(httpRequest);
                authenticationService.logout(accessToken, refreshToken);

                // Xoá cookie ở phía trình duyệt: set cùng tên/path nhưng maxAge = 0
                clearRefreshTokenCookie(response);

                return ApiResponse.<Void>builder()
                                .code(200)
                                .message("Logout successfully")
                                .build();
        }

        // =========================
        // CHANGE PASSWORD
        // =========================
        @PostMapping("/change-password")
        public ApiResponse<Void> changePassword(
                        @Valid @RequestBody ChangePasswordRequest request,
                        HttpServletRequest httpRequest,
                        @CookieValue(name = "refreshToken", required = false) String refreshToken,
                        HttpServletResponse response)
                        throws ParseException, JOSEException {
                String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
                authenticationService.changePassword(currentEmail, request, extractBearerToken(httpRequest),
                                refreshToken);
                clearRefreshTokenCookie(response);
                return ApiResponse.<Void>builder()
                                .code(200)
                                .message("Password changed successfully")
                                .build();
        }

        // =========================
        // FORGOT PASSWORD
        // =========================
        @PostMapping("/forgot-password")
        public ApiResponse<Void> forgotPassword(@RequestParam String email) {
                authenticationService.forgotPassword(email);
                return ApiResponse.<Void>builder()
                                .code(200)
                                .message("If the email exists, a reset link has been sent")
                                .build();
        }

        // =========================
        // RESET PASSWORD
        // =========================
        @PostMapping("/reset-password")
        public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
                authenticationService.resetPassword(request);
                return ApiResponse.<Void>builder()
                                .code(200)
                                .message("Password reset successfully")
                                .build();
        }

        // =========================================================
        // PRIVATE HELPERS
        // =========================================================

        // Gom logic tạo cookie vào 1 chỗ — login() và refreshToken() đều dùng chung,
        // tránh copy-paste config cookie (httpOnly/secure/sameSite/path/maxAge) 2 lần
        // dễ lệch nhau.
        private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
                ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                                .httpOnly(true)
                                .secure(secureCookies)
                                .sameSite("Lax")
                                .path("/api/v1/auth")
                                .maxAge(Duration.ofDays(7))
                                .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        private void clearRefreshTokenCookie(HttpServletResponse response) {
                ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                                .httpOnly(true)
                                .secure(secureCookies)
                                .sameSite("Lax")
                                .path("/api/v1/auth")
                                .maxAge(0)
                                .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        // Đọc "Authorization: Bearer <token>" từ header, trả về null nếu không có
        // (không throw — logout không nên chặn user vì thiếu/sai header).
        private String extractBearerToken(HttpServletRequest request) {
                String header = request.getHeader(HttpHeaders.AUTHORIZATION);
                if (header != null && header.startsWith("Bearer ")) {
                        return header.substring(7);
                }
                return null;
        }
}