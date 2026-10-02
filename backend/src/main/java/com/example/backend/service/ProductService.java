package com.example.backend.service;

import com.example.backend.dto.request.CreateProductRequest;
import com.example.backend.dto.request.UpdateProductRequest;
import com.example.backend.dto.response.PageResponse;
import com.example.backend.dto.response.ProductDetailResponse;
import com.example.backend.dto.response.ProductImageResponse;
import com.example.backend.dto.response.ProductListItemResponse;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    /**
     * Lấy danh sách sản phẩm công khai kèm phân trang và bộ lọc linh hoạt.
     * Tự động loại bỏ các sản phẩm đã xóa mềm (isDeleted = true).
     */
    PageResponse<ProductListItemResponse> getProducts(
            int page,
            int size,
            String categorySlug,
            String search,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sort
    );

    /**
     * Lấy thông tin chi tiết một sản phẩm công khai theo slug.
     */
    ProductDetailResponse getProductBySlug(String slug);

    /**
     * Tạo mới sản phẩm (Dành cho ADMIN).
     * Bắt buộc kiểm tra trùng slug/sku và sanitize description trước khi lưu.
     */
    ProductDetailResponse createProduct(CreateProductRequest request);

    /**
     * Cập nhật thông tin sản phẩm (Dành cho ADMIN).
     */
    ProductDetailResponse updateProduct(String id, UpdateProductRequest request);

    /**
     * Xóa mềm sản phẩm (Dành cho ADMIN).
     */
    void softDeleteProduct(String id);

    /**
     * Upload danh sách hình ảnh cho sản phẩm (Dành cho ADMIN).
     */
    List<ProductImageResponse> uploadProductImages(String productId, List<MultipartFile> files);
}
