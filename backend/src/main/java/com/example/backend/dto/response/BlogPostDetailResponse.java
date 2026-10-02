package com.example.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Response chi tiết đầy đủ cho bài viết BlogPost (GET /api/v1/blog-posts/{slug}, POST, PUT).
 * Chứa nội dung rich text `content` đã được làm sạch bảo mật (HTML sanitized).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BlogPostDetailResponse {
    String id;
    String title;
    String slug;
    String coverImageUrl;
    String excerpt;
    String content;
    Set<String> tags;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
