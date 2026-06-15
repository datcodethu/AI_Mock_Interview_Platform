package org.example.ai_mock_interview_platform.model.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ErrorResponse {
    private int code;
    private String message;
}