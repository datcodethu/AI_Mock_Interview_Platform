package com.example.backend.service;

import com.example.backend.dto.request.CreateUserRequest;
import com.example.backend.dto.request.UpdateUserRequest;
import com.example.backend.dto.response.PageResponse;
import com.example.backend.dto.response.ProfileResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.utils.UserStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<UserResponse> getUsers(int page, int size, String search, UserStatus status, String role) {
        Pageable pageable = PageRequest.of(Math.max(0, page), size > 0 ? size : 10, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), pattern);
                Predicate namePredicate = cb.like(cb.lower(root.get("userName")), pattern);
                Predicate phonePredicate = cb.like(cb.lower(root.get("phoneNumber")), pattern);
                predicates.add(cb.or(emailPredicate, namePredicate, phonePredicate));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (role != null && !role.trim().isEmpty()) {
                Join<User, Role> roleJoin = root.join("roles");
                predicates.add(cb.equal(roleJoin.get("name"), role.trim().toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> userPage = userRepository.findAll(spec, pageable);
        List<UserResponse> content = userPage.getContent().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return mapToUserResponse(user);
    }

    public ProfileResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhoneNumber())
                .status(user.getStatus())
                .fullName(user.getUserName())
                .build();
    }

    @Transactional
    public User creat(CreateUserRequest rq) {
        if (userRepository.existsByEmail(rq.getEmail())) {
            log.info("Create user failed - email already exists: {}", rq.getEmail());
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Set<Role> roles = rq.getRoles().stream()
                .map(id -> roleRepository.findById(Short.valueOf(id))
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
                .collect(Collectors.toSet());

        String currentAdmin = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = User.builder()
                .email(rq.getEmail())
                .passwordHash(passwordEncoder.encode(rq.getPassword()))
                .roles(roles)
                .status(UserStatus.ACTIVE)
                .createdBy(currentAdmin)
                .updatedBy(currentAdmin)
                .build();

        user = userRepository.save(user);
        log.info("User created by [{}] - new user email: {}", currentAdmin, user.getEmail());

        return user;
    }

    public User update(UpdateUserRequest rq) {
        User user = userRepository.findByEmail(rq.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userRepository.save(user);
    }

    @Transactional
    public User deleteUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        return user;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void lockUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        log.info("User [{}] locked by admin", id);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void unlockUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        log.info("User [{}] unlocked by admin", id);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUserRoles(String id, List<String> roleNames) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            String normalizedRole = roleName.startsWith("ROLE_") ? roleName.substring(5) : roleName;
            Role role = roleRepository.findByName(normalizedRole)
                    .orElseGet(() -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)));
            roles.add(role);
        }

        user.setRoles(roles);
        user = userRepository.save(user);
        log.info("Updated roles for user [{}] to {}", id, roleNames);
        return mapToUserResponse(user);
    }

    public UserResponse mapToUserResponse(User user) {
        Set<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
                : Collections.emptySet();

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getUserName())
                .phone(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
