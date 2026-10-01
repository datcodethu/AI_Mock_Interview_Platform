package com.example.backend.service;

import com.example.backend.constans.RoleConstants;
import com.example.backend.dto.request.*;
import com.example.backend.dto.response.AuthenticationResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.entity.*;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.*;
import com.example.backend.utils.UserStatus;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * 1. Register — tạo tài khoản
 * 2. Verify email — kích hoạt tài khoản
 * 3. Resend verification — hỗ trợ khi (2) thất bại/hết hạn
 * 4. Login — đăng nhập
 * 5. Refresh token — duy trì phiên đăng nhập
 * 6. Logout — kết thúc phiên
 * 7. Change password — user tự đổi mật khẩu khi đã đăng nhập
 * 8. Forgot / Reset password — user quên mật khẩu, chưa đăng nhập được
 * 9. Private helpers — các hàm dùng chung, đặt cuối cùng
 */
@Slf4j
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AuthenticationService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    JwtService jwtService;
    EmailService emailService;
    EmailVerificationTokenRepository emailVerificationTokenRepository;
    PasswordResetTokenRepository passwordResetTokenRepository;
    InvalidTokenRepository invalidTokenRepository;

    // =========================================================
    // 1. REGISTER
    // =========================================================

    @Transactional(rollbackFor = Exception.class)
    public RegisterResponse register(RegisterRequest rq) {

        Optional<User> existingUser = userRepository.findByEmail(rq.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (user.getStatus() == UserStatus.PENDING_VERIFY) {
                emailVerificationTokenRepository.deleteByUserId(user.getId());
                EmailVerificationToken verificationToken = createAndSendVerificationToken(user);
                return RegisterResponse.builder()
                        .email(user.getEmail())
                        .status(user.getStatus())
                        .expiresAt(toEpochMillis(verificationToken.getExpiresAt()))
                        .build();
            }

            log.info("Register rejected - email already belongs to an active account");
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (userRepository.existsByPhoneNumber(rq.getPhoneNumber())) {
            log.info("Register failed - phone number already in use");
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        Role defaultRole = roleRepository.findByName(RoleConstants.CUSTOMER)
                .orElseThrow(() -> {
                    log.error("Register failed - default role [{}] not found in DB", RoleConstants.CUSTOMER);
                    return new AppException(ErrorCode.ROLE_NOT_FOUND);
                });

        User user = User.builder()
                .email(rq.getEmail())
                .passwordHash(passwordEncoder.encode(rq.getPassword()))
                .phoneNumber(rq.getPhoneNumber())
                .userName(rq.getFullName())
                .status(UserStatus.PENDING_VERIFY)
                .roles(new HashSet<>(Set.of(defaultRole)))
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        EmailVerificationToken verificationToken = createAndSendVerificationToken(user);

        return RegisterResponse.builder()
                .email(user.getEmail())
                .status(user.getStatus())
                .expiresAt(toEpochMillis(verificationToken.getExpiresAt()))
                .build();
    }

    // =========================================================
    // 2. VERIFY EMAIL
    // =========================================================

    @Transactional
    public AuthenticationResponse verifyEmail(String token) {
        EmailVerificationToken emailVerificationToken = emailVerificationTokenRepository
                .findByTokenAndUsedFalse(token)
                .orElseThrow(() -> {
                    log.warn("Verify email failed - invalid or already used token: {}", token);
                    return new AppException(ErrorCode.VERIFY_TOKEN_INVALID);
                });

        if (emailVerificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.info("Verify email failed - token expired: {}", token);
            throw new AppException(ErrorCode.VERIFY_TOKEN_EXPIRED);
        }

        User user = emailVerificationToken.getUser();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        emailVerificationToken.setUsed(true);
        emailVerificationTokenRepository.save(emailVerificationToken);

        log.info("Email verified successfully for user: {}", user.getEmail());

        return AuthenticationResponse.builder()
                .accessToken(jwtService.generateToken(user.getEmail()))
                .refreshToken(jwtService.generateRefreshToken(user.getEmail()))
                .build();
    }

    // =========================================================
    // 3. RESEND VERIFICATION EMAIL
    // =========================================================

    @Transactional
    public long resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Resend verification failed - user not found: {}", email);
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        if (user.getStatus() != UserStatus.PENDING_VERIFY) {
            log.info("Resend verification rejected - account status is [{}] for: {}",
                    user.getStatus(), email);
            throw new AppException(ErrorCode.ACCOUNT_ALREADY_VERIFIED);
        }

        emailVerificationTokenRepository.deleteByUserId(user.getId());
        EmailVerificationToken verificationToken = createAndSendVerificationToken(user);

        log.info("Verification email resent for: {}", email);
        return toEpochMillis(verificationToken.getExpiresAt());
    }

    // =========================================================
    // 4. LOGIN
    // =========================================================

    public AuthenticationResponse login(AuthenticationRequest rq) {
        User user = userRepository.findByEmail(rq.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed - email not found: {}", rq.getEmail());
                    return new AppException(ErrorCode.WRONG_CREDENTIALS);
                });

        if (!passwordEncoder.matches(rq.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed - wrong password for email: {}", rq.getEmail());
            throw new AppException(ErrorCode.WRONG_CREDENTIALS);
        }

        validateAccountIsActive(user);

        String accessToken = jwtService.generateToken(rq.getEmail());
        String refreshToken = jwtService.generateRefreshToken(rq.getEmail());

        log.info("Login successful for email: {}", rq.getEmail());

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // =========================================================
    // 5. REFRESH TOKEN
    // =========================================================

    @Transactional
    public AuthenticationResponse refreshToken(String refreshTokenStr)
            throws ParseException, JOSEException {

        // refreshTokenStr lấy từ cookie (Controller đọc bằng @CookieValue), KHÔNG còn
        // nằm trong request body nữa. verifyRefreshToken() tự check chữ ký, hạn,
        // issuer,
        // type, và blacklist — không cần kiểm tra lại thủ công ở đây.
        SignedJWT refreshToken = jwtService.verifyRefreshToken(refreshTokenStr);

        String email = refreshToken.getJWTClaimsSet().getSubject();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("Refresh token failed - user no longer exists for email: {}", email);
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        validateAccountIsActive(user);

        // Refresh token rotation: revoke token CŨ trước khi cấp token mới,
        // để tránh race window nếu có request khác dùng cùng token này song song
        revokeToken(refreshToken);

        String newAccessToken = jwtService.generateToken(email);
        String newRefreshToken = jwtService.generateRefreshToken(email);
        log.info("Token refreshed for: {}", email);

        return AuthenticationResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    // =========================================================
    // 6. LOGOUT
    // =========================================================

    /**
     * Nhận 2 chuỗi token thô thay vì LogoutRequest:
     * - accessToken: Controller lấy từ header Authorization của chính request
     * logout này
     * - refreshTokenStr: Controller lấy từ cookie
     * Cả 2 đều CÓ THỂ null (thiếu header, cookie hết hạn/đã xoá...) — logout vẫn
     * phải
     * thành công bình thường trong mọi trường hợp, chỉ revoke được cái nào có sẵn.
     * Không throw checked exception nữa: mọi lỗi parse/verify token đều bị nuốt
     * (log lại
     * để trace khi cần), vì mục tiêu của logout là "kết thúc phiên", không phải
     * "xác thực".
     */
    @Transactional
    public void logout(String accessToken, String refreshTokenStr) {
        if (accessToken != null) {
            try {
                revokeToken(jwtService.verifyAccessToken(accessToken));
            } catch (AppException | ParseException | JOSEException e) {
                log.debug("Logout - access token already invalid/expired, skip revoke: {}", e.getMessage());
            }
        }

        if (refreshTokenStr != null) {
            try {
                revokeToken(jwtService.verifyRefreshToken(refreshTokenStr));
            } catch (AppException | ParseException | JOSEException e) {
                log.debug("Logout - refresh token already invalid/expired, skip revoke: {}", e.getMessage());
            }
        }

        log.info("Logout processed (access/refresh revoked when valid)");
    }

    // =========================================================
    // 7. CHANGE PASSWORD (khi đã đăng nhập)
    // =========================================================

    @Transactional
    public void changePassword(String email, ChangePasswordRequest rq, String accessToken, String refreshToken)
            throws ParseException, JOSEException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(rq.getOldPassword(), user.getPasswordHash())) {
            log.warn("Change password failed - wrong old password for: {}", email);
            throw new AppException(ErrorCode.WRONG_CREDENTIALS);
        }

        if (!Objects.equals(rq.getNewPassword(), rq.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        user.setPasswordHash(passwordEncoder.encode(rq.getNewPassword()));
        userRepository.save(user);

        if (accessToken != null) {
            try {
                revokeToken(jwtService.verifyAccessToken(accessToken));
            } catch (AppException | ParseException | JOSEException e) {
                log.debug("Change password - access token already invalid, skip revoke: {}", e.getMessage());
            }
        }
        if (refreshToken != null) {
            try {
                revokeToken(jwtService.verifyRefreshToken(refreshToken));
            } catch (AppException | ParseException | JOSEException e) {
                log.debug("Change password - refresh token already invalid, skip revoke: {}", e.getMessage());
            }
        }

        log.info("Password changed successfully for: {}", email);
    }

    // =========================================================
    // 8. FORGOT PASSWORD / RESET PASSWORD (khi chưa đăng nhập được)
    // =========================================================

    @Transactional
    public void forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.info("Forgot password requested for non-existing email: {}", email);
            return;
        }

        User user = userOpt.get();
        passwordResetTokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailService.sendResetPasswordEmail(user.getEmail(), token);
        log.info("Password reset token created for: {}", email);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest rq) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenAndUsedFalse(rq.getToken())
                .orElseThrow(() -> {
                    log.warn("Reset password failed - invalid or already used token");
                    return new AppException(ErrorCode.RESET_TOKEN_INVALID);
                });

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.info("Reset password failed - token expired");
            throw new AppException(ErrorCode.RESET_TOKEN_EXPIRED);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(rq.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset successfully for: {}", user.getEmail());
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private void validateAccountIsActive(User user) {
        if (user.getStatus() == UserStatus.PENDING_VERIFY) {
            log.info("Account not verified: {}", user.getEmail());
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            log.warn("Account locked: {}", user.getEmail());
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            log.error("Unexpected account status [{}] for: {}", user.getStatus(), user.getEmail());
            throw new AppException(ErrorCode.ACCOUNT_INVALID_STATUS);
        }
    }

    private EmailVerificationToken createAndSendVerificationToken(User user) {
        String token = UUID.randomUUID().toString();
        EmailVerificationToken evt = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();

        evt = emailVerificationTokenRepository.save(evt);
        try {
            emailService.sendVerifyEmail(user.getEmail(), token);
        } catch (MailException e) {
            log.error("Failed to send verification email for user: {}", user.getEmail(), e);
            throw new AppException(ErrorCode.VERIFICATION_EMAIL_FAILED);
        }

        log.debug("Verification token created and email dispatched for: {}", user.getEmail());
        return evt;
    }

    private long toEpochMillis(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private void revokeToken(SignedJWT token) throws ParseException {
        String tokenId = token.getJWTClaimsSet().getJWTID();
        Date expirationTime = token.getJWTClaimsSet().getExpirationTime();

        InvalidToken invalidToken = InvalidToken.builder()
                .id(tokenId)
                .expires(expirationTime)
                .build();

        invalidTokenRepository.save(invalidToken);
        log.debug("Token revoked - jti: {}", tokenId);
    }
}