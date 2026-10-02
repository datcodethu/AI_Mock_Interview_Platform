package com.example.backend.controller;

import com.example.backend.dto.request.CreateProductRequest;
import com.example.backend.dto.request.UpdateProductRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.ProductDetailResponse;
import com.example.backend.dto.response.ProductImageResponse;
import com.example.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller quản trị dành cho Quản trị viên (ADMIN) thao tác với Sản phẩm.
 *
 * QUYẾT ĐỊNH BẢO MẬT BẮT BUỘC:
 * 1. DEFENSE-IN-DEPTH:
 *    - Toàn bộ controller được gắn @PreAuthorize("hasRole('ADMIN')") ở mức class VÀ
 *      ở TỪNG METHOD riêng lẻ.
 *    - TẠI SAO: Không bao giờ chỉ phụ thuộc vào chuỗi cấu hình đường dẫn trong SecurityConfig.
 *      Nếu một lập trình viên vô tình thay đổi đường dẫn URL hoặc thứ tự filterChain trong SecurityConfig,
 *      các method có @PreAuthorize vẫn được bảo vệ độc lập bởi Spring Method Security AOP.
 * 2. KHÔNG DÙNG ENTITY TRỰC TIẾP:
 *    - Toàn bộ dữ liệu vào ra đều thông qua Request/Response DTO và bọc trong ApiResponse<T>.
 *    - TẠI SAO: Ngăn ngừa Over-posting / Mass-assignment (kẻ tấn công gửi thêm các trường như isDeleted=true,
 *      createdBy, id) và ngăn lộ thông tin nhạy cảm của hệ thống.
 */
@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    /**
     * Tạo mới một sản phẩm.
     * Endpoint được kiểm tra quyền ADMIN tường minh ở method level.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductDetailResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request
    ) {
        ProductDetailResponse response = productService.createProduct(request);

        return ApiResponse.<ProductDetailResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Product created successfully")
                .data(response)
                .build();
    }

    /**
     * Cập nhật thông tin sản phẩm theo ID.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductDetailResponse> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        ProductDetailResponse response = productService.updateProduct(id, request);

        return ApiResponse.<ProductDetailResponse>builder()
                .code(200)
                .message("Product updated successfully")
                .data(response)
                .build();
    }

    /**
     * Xóa mềm sản phẩm theo ID (isDeleted = true, không xóa vật lý).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteProduct(@PathVariable String id) {
        productService.softDeleteProduct(id);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Product deleted successfully")
                .build();
    }

    /**
     * Upload hình ảnh cho sản phẩm.
     * Nhận multipart/form-data. Việc validate định dạng nhị phân (magic bytes) và kích thước
     * được thực hiện nghiêm ngặt ở tầng Service.
     */
    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<ProductImageResponse>> uploadImages(
            @PathVariable String id,
            @RequestParam("files") List<MultipartFile> files
    ) {
        List<ProductImageResponse> response = productService.uploadProductImages(id, files);

        return ApiResponse.<List<ProductImageResponse>>builder()
                .code(HttpStatus.CREATED.value())
                .message("Images uploaded successfully")
                .data(response)
                .build();
    }
}
