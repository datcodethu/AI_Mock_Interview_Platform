package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO nhẹ dùng cho API danh sách sản phẩm (GET /api/v1/products).
 *
 * TỐI ƯU HIỆU NĂNG:
 * - KHÔNG chứa trường `description` (HTML có thể dài tới hàng chục KB).
 *   Việc này giúp giảm băng thông mạng (payload size), tiết kiệm RAM serialize JSON
 *   và tăng tốc độ load trang đáng kể khi phân trang nhiều sản phẩm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemResponse {
    private String id;
    private String name;
    private String slug;
    private String categoryId;
    private String categoryName;
    private String categorySlug;
    private String shortDescription;
    private BigDecimal price; // null = "liên hệ báo giá"
    private String sku;
    private Boolean inStock;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
