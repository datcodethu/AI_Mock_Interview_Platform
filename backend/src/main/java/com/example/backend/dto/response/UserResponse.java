package com.example.backend.dto.response;

import com.example.backend.utils.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Set;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class UserResponse {
    String id;
    String email;
    String fullName;
    String phone;
    String avatarUrl;
    UserStatus status;
    Set<String> roles;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
