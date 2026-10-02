package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO trả thông tin từng ảnh của sản phẩm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageResponse {
    private String id;
    private String url;
    private Integer sortOrder;
}
