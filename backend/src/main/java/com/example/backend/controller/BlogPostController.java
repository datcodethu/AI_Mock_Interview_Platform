package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.BlogPostDetailResponse;
import com.example.backend.dto.response.BlogPostSummaryResponse;
import com.example.backend.dto.response.PageResponse;
import com.example.backend.service.BlogPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Controller công khai (Public) dành cho người dùng xem danh sách và chi tiết bài viết tin tức.
 * Toàn bộ endpoint ở đây được cấu hình permitAll() trong SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/blog-posts")
@RequiredArgsConstructor
public class BlogPostController {

    private final BlogPostService blogPostService;

    /**
     * Lấy danh sách bài viết có phân trang, tìm kiếm và lọc theo tag.
     */
    @GetMapping
    public ApiResponse<PageResponse<BlogPostSummaryResponse>> getBlogPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String sort
    ) {
        PageResponse<BlogPostSummaryResponse> response = blogPostService.getBlogPosts(page, size, search, tag, sort);

        return ApiResponse.<PageResponse<BlogPostSummaryResponse>>builder()
                .code(200)
                .message("Success")
                .data(response)
                .build();
    }

    /**
     * Lấy chi tiết bài viết đầy đủ theo slug.
     */
    @GetMapping("/{slug}")
    public ApiResponse<BlogPostDetailResponse> getBlogPostBySlug(@PathVariable String slug) {
        BlogPostDetailResponse response = blogPostService.getBlogPostBySlug(slug);

        return ApiResponse.<BlogPostDetailResponse>builder()
                .code(200)
                .message("Success")
                .data(response)
                .build();
    }
}
