package com.example.backend.dto.response;

import com.example.backend.entity.Role;
import com.example.backend.utils.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

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
    UserStatus status;
    Set<Role> roles;
}
