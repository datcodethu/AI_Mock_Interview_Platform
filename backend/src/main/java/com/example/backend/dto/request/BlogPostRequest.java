package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

/**
 * Request payload cho tạo mới và cập nhật bài viết BlogPost.
 * Không nhận các trường audit hoặc trường hệ thống (id, createdAt, isDeleted...).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BlogPostRequest {

    @NotBlank(message = "Tiêu đề bài viết không được để trống")
    @Size(max = 250, message = "Tiêu đề không được vượt quá 250 ký tự")
    String title;

    @NotBlank(message = "Slug không được để trống")
    @Size(max = 250, message = "Slug không được vượt quá 250 ký tự")
    String slug;

    @Size(max = 500, message = "URL ảnh bìa không được vượt quá 500 ký tự")
    String coverImageUrl;

    @Size(max = 300, message = "Đoạn trích (excerpt) không được vượt quá 300 ký tự")
    String excerpt;

    @NotBlank(message = "Nội dung bài viết không được để trống")
    String content;

    Set<String> tags;
}
