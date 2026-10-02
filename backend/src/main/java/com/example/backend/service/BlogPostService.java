package com.example.backend.service;

import com.example.backend.dto.request.BlogPostRequest;
import com.example.backend.dto.response.BlogPostDetailResponse;
import com.example.backend.dto.response.BlogPostSummaryResponse;
import com.example.backend.dto.response.PageResponse;

public interface BlogPostService {

    /**
     * Lấy danh sách bài viết công khai có hỗ trợ phân trang, tìm kiếm và lọc theo tag.
     * Tự động loại bỏ các bài viết đã xóa mềm (isDeleted = false).
     */
    PageResponse<BlogPostSummaryResponse> getBlogPosts(
            int page,
            int size,
            String search,
            String tag,
            String sort
    );

    /**
     * Lấy chi tiết bài viết công khai theo slug.
     */
    BlogPostDetailResponse getBlogPostBySlug(String slug);

    /**
     * Tạo bài viết mới (Dành cho ADMIN).
     * Bắt buộc kiểm tra trùng slug và làm sạch HTML (Sanitize chống XSS) trước khi lưu.
     */
    BlogPostDetailResponse createBlogPost(BlogPostRequest request);

    /**
     * Cập nhật thông tin bài viết theo ID (Dành cho ADMIN).
     */
    BlogPostDetailResponse updateBlogPost(String id, BlogPostRequest request);

    /**
     * Xóa mềm bài viết theo ID (isDeleted = true, dành cho ADMIN).
     */
    void deleteBlogPost(String id);
}
