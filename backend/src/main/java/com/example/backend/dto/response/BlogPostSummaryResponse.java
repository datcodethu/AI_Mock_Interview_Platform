package com.example.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Response rút gọn cho danh sách bài viết (GET /api/v1/blog-posts).
 * Không chứa trường `content` (HTML dài) để tối ưu băng thông mạng và hiệu năng truy vấn.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BlogPostSummaryResponse {
    String id;
    String title;
    String slug;
    String coverImageUrl;
    String excerpt;
    Set<String> tags;
    LocalDateTime createdAt;
}
