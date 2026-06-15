package org.example.ai_mock_interview_platform.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiResponse <T> {
    private int code;
    private String message;
    private T data;
}
