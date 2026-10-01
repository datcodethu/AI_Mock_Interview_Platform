package com.example.backend.controller;

import com.example.backend.dto.request.CreateUserRequest;
import com.example.backend.dto.request.UpdateUserRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.ProfileResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.User;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<List<UserResponse>> getAllUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .data(userService.getAllUsers())
                .code(200)
                .message("OK")
                .build();
    }

    @PreAuthorize("hasRole('ADMIN') or #email == authentication.name")
    @GetMapping("/{email}")
    public ApiResponse<ProfileResponse> getUserByEmail(@PathVariable("email") String email) {
        return ApiResponse.<ProfileResponse>builder()
                .message("success")
                .data(userService.getUserByEmail(email))
                .code(200)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ApiResponse<User> create(@RequestBody CreateUserRequest rq) {
        return ApiResponse.<User>builder()
                .message("created")
                .data(userService.creat(rq))
                .code(201)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN') or #rq.id == authentication.name")
    @PutMapping
    public ApiResponse<User> update(@RequestBody UpdateUserRequest rq) {
        return ApiResponse.<User>builder()
                .message("updated")
                .data(userService.update(rq))
                .code(200)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ApiResponse<User> delete(@PathVariable String id) {
        return ApiResponse.<User>builder()
                .message("deleted")
                .data(userService.deleteUserById(id))
                .build();
    }
}