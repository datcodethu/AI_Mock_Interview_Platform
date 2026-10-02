package com.example.backend.controller;

import com.example.backend.dto.request.BlogPostRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.BlogPostDetailResponse;
import com.example.backend.service.BlogPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản trị dành cho Quản trị viên (ADMIN) thao tác với Bài viết / Tin tức.
 *
 * QUYẾT ĐỊNH BẢO MẬT BẮT BUỘC:
 * 1. DEFENSE-IN-DEPTH:
 *    - Toàn bộ controller được gắn @PreAuthorize("hasRole('ADMIN')") ở mức class VÀ ở từng method riêng lẻ.
 *    - Không phụ thuộc duy nhất vào chuỗi cấu hình đường dẫn trong SecurityConfig.
 * 2. KHÔNG DÙNG ENTITY TRỰC TIẾP:
 *    - Toàn bộ dữ liệu vào ra đều thông qua Request/Response DTO và bọc trong ApiResponse<T>.
 */
@RestController
@RequestMapping("/api/v1/admin/blog-posts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBlogPostController {

    private final BlogPostService blogPostService;

    /**
     * Tạo mới một bài viết.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BlogPostDetailResponse> createBlogPost(
            @Valid @RequestBody BlogPostRequest request
    ) {
        BlogPostDetailResponse response = blogPostService.createBlogPost(request);

        return ApiResponse.<BlogPostDetailResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Blog post created successfully")
                .data(response)
                .build();
    }

    /**
     * Cập nhật thông tin bài viết theo ID.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BlogPostDetailResponse> updateBlogPost(
            @PathVariable String id,
            @Valid @RequestBody BlogPostRequest request
    ) {
        BlogPostDetailResponse response = blogPostService.updateBlogPost(id, request);

        return ApiResponse.<BlogPostDetailResponse>builder()
                .code(200)
                .message("Blog post updated successfully")
                .data(response)
                .build();
    }

    /**
     * Xóa mềm bài viết theo ID (isDeleted = true).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteBlogPost(@PathVariable String id) {
        blogPostService.deleteBlogPost(id);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Blog post deleted successfully")
                .build();
    }
}
