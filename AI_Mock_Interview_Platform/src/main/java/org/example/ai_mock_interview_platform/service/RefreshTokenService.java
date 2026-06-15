package org.example.ai_mock_interview_platform.service;

import lombok.RequiredArgsConstructor;
import org.example.ai_mock_interview_platform.repository.RefreshTokenRepository;
import org.example.ai_mock_interview_platform.model.entity.RefreshToken;
import org.example.ai_mock_interview_platform.model.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    private final long refreshTokenExpiration = 30L;
    @Transactional
    // Tạo và lưu refresh token vào DB
    public RefreshToken createRefreshToken(User user) {
        // Xóa token cũ nếu có
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiredAt(LocalDateTime.now().plusMinutes(refreshTokenExpiration))
                .isRevoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    // Kiểm tra refresh token hợp lệ
    public RefreshToken verifyRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token không hợp lệ"));

        if (refreshToken.getIsRevoked()) {
            throw new RuntimeException("Refresh token đã bị thu hồi");
        }

        if (LocalDateTime.now().isAfter(refreshToken.getExpiredAt())) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token đã hết hạn, vui lòng đăng nhập lại");
        }

        return refreshToken;
    }

    // Thu hồi token (dùng khi logout)
    public void revokeRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token không tồn tại"));
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }
}