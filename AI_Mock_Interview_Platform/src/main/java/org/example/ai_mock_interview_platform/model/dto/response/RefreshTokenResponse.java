package org.example.ai_mock_interview_platform.model.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RefreshTokenResponse {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
}