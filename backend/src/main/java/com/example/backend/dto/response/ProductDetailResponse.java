package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO chi tiết đầy đủ cho sản phẩm (GET /api/v1/products/{slug}, POST, PUT).
 * Chứa toàn bộ thông tin: mô tả chi tiết HTML (đã được sanitize an toàn), danh sách ảnh và audit info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {
    private String id;
    private String name;
    private String slug;
    private String categoryId;
    private String categoryName;
    private String categorySlug;
    private String shortDescription;
    private String description; // Nội dung HTML đã qua Jsoup sanitization
    private BigDecimal price;   // null = "liên hệ báo giá"
    private String sku;
    private Boolean inStock;
    private List<ProductImageResponse> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
