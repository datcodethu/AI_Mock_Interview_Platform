package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO tạo mới sản phẩm từ phía ADMIN.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 200, message = "Tên sản phẩm không được vượt quá 200 ký tự")
    private String name;

    @NotBlank(message = "Slug không được để trống")
    @Size(max = 250, message = "Slug không được vượt quá 250 ký tự")
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug chỉ được chứa chữ thường, số và dấu gạch ngang (kebab-case)")
    private String slug;

    @NotBlank(message = "Danh mục không được để trống")
    private String categoryId;

    @Size(max = 1000, message = "Mô tả ngắn không được vượt quá 1000 ký tự")
    private String shortDescription;

    /**
     * Nội dung HTML chi tiết.
     * Sẽ được sanitize bằng Jsoup Safelist.relaxed() ở tầng Service trước khi lưu vào DB.
     */
    private String description;

    /**
     * Giá sản phẩm. Cho phép null = "liên hệ báo giá".
     */
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá sản phẩm không được là số âm")
    private BigDecimal price;

    @NotBlank(message = "Mã SKU không được để trống")
    @Size(max = 100, message = "SKU không được vượt quá 100 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "SKU chỉ được chứa chữ cái, số, dấu gạch dưới hoặc gạch ngang")
    private String sku;

    @Builder.Default
    private Boolean inStock = true;
}
