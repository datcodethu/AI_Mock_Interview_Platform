package com.example.backend.dto.response;

import com.example.backend.utils.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileResponse {
    String id;
    String email;
    String fullName;
    String phone;
    UserStatus status;
}
