package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.PageResponse;
import com.example.backend.dto.response.ProductDetailResponse;
import com.example.backend.dto.response.ProductListItemResponse;
import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Controller công khai (Public) dành cho khách truy cập và người dùng cuối.
 * Toàn bộ endpoint ở đây được cấu hình permitAll() trong SecurityConfig.
 *
 * NGUYÊN TẮC:
 * - Không bao giờ nhận vào hoặc trả ra Entity trực tiếp, luôn bọc qua
 * ApiResponse<DTO>.
 * - Tự động loại trừ sản phẩm đã xóa mềm (isDeleted = true) ở tầng truy vấn.
 */
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

        private final ProductService productService;

        /**
         * Lấy danh sách sản phẩm có hỗ trợ phân trang và tìm kiếm / lọc.
         * Sử dụng ProductListItemResponse nhẹ (không chứa description dài) để tối ưu
         * payload.
         */
        @GetMapping
        public ApiResponse<PageResponse<ProductListItemResponse>> getProducts(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(required = false) String categorySlug,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) BigDecimal minPrice,
                        @RequestParam(required = false) BigDecimal maxPrice,
                        @RequestParam(required = false) String sort

        ) {
                PageResponse<ProductListItemResponse> response = productService.getProducts(
                                page, size, categorySlug, search, minPrice, maxPrice, sort);

                return ApiResponse.<PageResponse<ProductListItemResponse>>builder()
                                .code(200)
                                .message("Success")
                                .data(response)
                                .build();
        }

        /**
         * Lấy chi tiết đầy đủ của sản phẩm theo slug (bao gồm mô tả HTML an toàn và
         * danh sách ảnh).
         */
        @GetMapping("/{slug}")
        public ApiResponse<ProductDetailResponse> getProductBySlug(@PathVariable String slug) {
                ProductDetailResponse response = productService.getProductBySlug(slug);

                return ApiResponse.<ProductDetailResponse>builder()
                                .code(200)
                                .message("Success")
                                .data(response)
                                .build();
        }
}
