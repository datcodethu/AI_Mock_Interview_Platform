package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // Ví dụ: "USER_CREATE"

    @Column(length = 50)
    private String module; // Ví dụ: "Quản lý User"

    @Column(name = "api_path")
    private String apiPath; // Ví dụ: "/api/v1/users"

    @Column(name = "http_method", length = 10)
    private String httpMethod; // Ví dụ: "POST"

    @Column(columnDefinition = "TEXT")
    private String description;

    // Audit fields
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Bảng Permission thường có quan hệ Many-To-Many với bảng Role
    // thông qua một bảng trung gian là role_permissions
}

