package org.example.ai_mock_interview_platform.repository;

import jakarta.transaction.Transactional;
import org.example.ai_mock_interview_platform.model.entity.RefreshToken;
import org.example.ai_mock_interview_platform.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    @Transactional
    void deleteByUser(User user);
}