package com.example.backend.dto.response;

import com.example.backend.utils.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterResponse {
    String email;
    UserStatus status;
    long expiresAt;
}