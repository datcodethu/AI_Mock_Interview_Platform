package org.example.ai_mock_interview_platform.model.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
public class AuthenticationResponse {
    private String accessToken;
    private String refreshToken;
    private String expiresIn;

}