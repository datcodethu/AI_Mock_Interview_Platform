package org.example.ai_mock_interview_platform.common.exception;

import lombok.Getter;
import org.example.ai_mock_interview_platform.common.utils.ErrorCode;

@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}