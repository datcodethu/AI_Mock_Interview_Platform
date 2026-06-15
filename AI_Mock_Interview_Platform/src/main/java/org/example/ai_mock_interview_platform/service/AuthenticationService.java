package org.example.ai_mock_interview_platform.service;

import lombok.RequiredArgsConstructor;
import org.example.ai_mock_interview_platform.common.exception.AppException;
import org.example.ai_mock_interview_platform.common.utils.ErrorCode;
import org.example.ai_mock_interview_platform.common.utils.UserStatus;
import org.example.ai_mock_interview_platform.model.dto.request.AuthenticationRequest;
import org.example.ai_mock_interview_platform.model.dto.request.RefreshTokenRequest;
import org.example.ai_mock_interview_platform.model.dto.response.AuthenticationResponse;
import org.example.ai_mock_interview_platform.model.dto.response.RefreshTokenResponse;
import org.example.ai_mock_interview_platform.model.dto.response.RegisterResponse;
import org.example.ai_mock_interview_platform.model.entity.RefreshToken;
import org.example.ai_mock_interview_platform.model.entity.User;
import org.example.ai_mock_interview_platform.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;

    private final EmailService emailService;

    private final RefreshTokenService refreshTokenService;

    public AuthenticationResponse login(AuthenticationRequest request) {

        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(request.getEmail(),request.getPassword()); // đóng gói
        Authentication auth =authenticationManager.authenticate(authenticationToken); // login
        User user = (User) auth.getPrincipal();
//        tạo refreshToken và lưu b=vào db
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthenticationResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(refreshToken.getToken()) // token từ DB
                .expiresIn(String.valueOf(jwtService.getAccessTokenExpiration() * 60))
                .build();
    }

    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        // 1. Kiểm tra refresh token
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(
                request.getRefreshToken()
        );

        // 2. Lấy user từ refresh token
        User user = refreshToken.getUser();

        // 3. Tạo access token mới
        String newAccessToken = jwtService.generateAccessToken(user);

        // 4. Tạo refresh token mới (rotate - bảo mật hơn)
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .expiresIn(jwtService.getAccessTokenExpiration() * 60)
                .build();
    }

    public RegisterResponse register(AuthenticationRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        // token verify  email
        String tokenVerify = UUID.randomUUID().toString();

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.INACTIVE)
                .isVerified(false)
                .verifyToken(tokenVerify)
                .verifyTokenExpiredAt(LocalDateTime.now().plusHours(24))
                .build();

        userRepository.save(user);

        // TODO: gửi email verify sau
        emailService.sendVerifyEmail(request.getEmail(), tokenVerify);

        return RegisterResponse.builder()
                .message("Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản")
                .build();
    }


    public String verifyEmail(String token) {

        User user = userRepository.findByVerifyToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ"));

        // Kiểm tra hết hạn
        if (LocalDateTime.now().isAfter(user.getVerifyTokenExpiredAt())) {
            throw new RuntimeException("Token đã hết hạn, vui lòng đăng ký lại");
        }

        // Kích hoạt tài khoản
        user.setIsVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setVerifyToken(null);           // xóa token sau khi dùng
        user.setVerifyTokenExpiredAt(null);
        userRepository.save(user);

        return "Xác thực thành công, bạn có thể đăng nhập";
    }


}
