package com.example.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateUserRolesRequest {
    @NotEmpty(message = "Roles cannot be empty")
    List<String> roles;
}
