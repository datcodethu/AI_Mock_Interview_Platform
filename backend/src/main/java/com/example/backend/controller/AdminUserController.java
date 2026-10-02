package com.example.backend.controller;

import com.example.backend.dto.request.UpdateUserRolesRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.PageResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.service.UserService;
import com.example.backend.utils.UserStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String role
    ) {
        PageResponse<UserResponse> response = userService.getUsers(page, size, search, status, role);
        return ApiResponse.<PageResponse<UserResponse>>builder()
                .code(200)
                .message("OK")
                .data(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getUserById(@PathVariable String id) {
        return ApiResponse.<UserResponse>builder()
                .code(200)
                .message("OK")
                .data(userService.getUserById(id))
                .build();
    }

    @PatchMapping("/{id}/lock")
    public ApiResponse<Void> lockUser(@PathVariable String id) {
        userService.lockUser(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("User locked successfully")
                .build();
    }

    @PatchMapping("/{id}/unlock")
    public ApiResponse<Void> unlockUser(@PathVariable String id) {
        userService.unlockUser(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("User unlocked successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable String id) {
        userService.deleteUserById(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("User deleted successfully")
                .build();
    }

    @PutMapping("/{id}/roles")
    public ApiResponse<UserResponse> updateUserRoles(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRolesRequest request
    ) {
        UserResponse response = userService.updateUserRoles(id, request.getRoles());
        return ApiResponse.<UserResponse>builder()
                .code(200)
                .message("User roles updated successfully")
                .data(response)
                .build();
    }
}
