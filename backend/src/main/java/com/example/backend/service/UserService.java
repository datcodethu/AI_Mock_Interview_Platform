package com.example.backend.service;

import com.example.backend.dto.request.CreateUserRequest;
import com.example.backend.dto.request.UpdateUserRequest;
import com.example.backend.dto.response.ProfileResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.utils.UserStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private RoleRepository roleRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserResponse> userResponses = new ArrayList<>();
        for (User user : users) {
            UserResponse userResponse = new UserResponse();
            userResponse.setId(user.getId());
            userResponse.setEmail(user.getEmail());
            userResponse.setStatus(user.getStatus());
            userResponse.setRoles(user.getRoles());
            userResponses.add(userResponse);
        }

        return userResponses;
    }

    public ProfileResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(()-> new AppException(ErrorCode.USER_NOT_EXISTED));
        ProfileResponse profileResponse = ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhoneNumber())
                .status(user.getStatus())
                .fullName(user.getUserName())
                .build();
        return profileResponse;
    }

    @Transactional
    public User creat(CreateUserRequest rq) {

        if (userRepository.existsByEmail(rq.getEmail())) {
            log.info("Create user failed - email already exists: {}", rq.getEmail());
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // Tra các Role entity tương ứng với tên role client gửi lên
        // (giả định CreateUserRequest.getRoles() trả về Set<String>/List<String> tên role — xác nhận lại với bạn bên dưới)
        Set<Role> roles = rq.getRoles().stream()
                .map(id -> roleRepository.findById(Short.valueOf(id))
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
                .collect(Collectors.toSet());

        // Lấy admin đang thực hiện thao tác này để ghi vào createdBy/updatedBy (audit trail)
        String currentAdmin = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = User.builder()
                .email(rq.getEmail())
                .passwordHash(passwordEncoder.encode(rq.getPassword()))
                .roles(roles)
                // User do Admin tạo trực tiếp nên ACTIVE luôn, không cần verify email
                // như luồng self-register (khác với default PENDING_VERIFY của entity)
                .status(UserStatus.ACTIVE)
                .createdBy(currentAdmin)
                .updatedBy(currentAdmin)
                .build();
        // createdAt, updatedAt, isDeleted: KHÔNG set tay — BaseEntity đã có
        // @Builder.Default / @CreationTimestamp / @UpdateTimestamp tự lo phần này

        user = userRepository.save(user);
        log.info("User created by [{}] - new user email: {}", currentAdmin, user.getEmail());

        return user;
    }
    public User update(UpdateUserRequest rq) {
        User user = userRepository.findByEmail(rq.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
//
//        if (rq.getAvatarUrl() != null) user.setAvatarUrl(rq.getAvatarUrl());
//        if (rq.getStatus() != null) user.setStatus(rq.getStatus());
//        if (rq.getLockReason() != null) user.setLockReason(rq.getLockReason());
//        if (rq.getRoles() != null) user.setRoles(rq.getRoles());



        return userRepository.save(user);
    }

    public User deleteUserById(String id) {
        User user = userRepository.findById(id).orElseThrow(()-> new RuntimeException("User not found"));
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        return user;
    }
}
