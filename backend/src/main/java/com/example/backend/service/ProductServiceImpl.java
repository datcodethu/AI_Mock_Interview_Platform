package com.example.backend.service;

import com.example.backend.dto.request.CreateProductRequest;
import com.example.backend.dto.request.UpdateProductRequest;
import com.example.backend.dto.response.PageResponse;
import com.example.backend.dto.response.ProductDetailResponse;
import com.example.backend.dto.response.ProductImageResponse;
import com.example.backend.dto.response.ProductListItemResponse;
import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.entity.ProductImage;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductImageRepository;
import com.example.backend.repository.ProductRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.exception.ConstraintViolationException;
import com.example.backend.utils.HtmlSanitizer;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Service xử lý toàn bộ nghiệp vụ của module Sản phẩm (Product).
 *
 * TỔNG QUAN CÁC QUYẾT ĐỊNH BẢO MẬT & THIẾT KẾ:
 * 1. DEFENSE-IN-DEPTH: Phân quyền @PreAuthorize("hasRole('ADMIN')") được đặt ở cả Controller và Service.
 *    Ngay cả khi cấu hình SecurityConfig hay Controller bị cấu hình nhầm/sót, tầng Service vẫn từ chối thực thi.
 * 2. SANITIZE HTML CHỐNG STORED XSS:
 *    - Toàn bộ field `description` dù do ADMIN nhập vẫn bắt buộc phải đi qua Jsoup Safelist.relaxed().
 *    - TẠI SAO: Tài khoản admin có thể bị chiếm quyền (Account Takeover), nhân viên vô tình copy HTML độc hại
 *      hoặc nội bộ có rủi ro (Insider Threat). Làm sạch mã độc ngay trước khi ghi DB đảm bảo không bao giờ
 *      có script độc hại tồn tại trong database (Stored XSS).
 * 3. BẢO VỆ PHÂN TRANG VÀ TÀI NGUYÊN (CLAMPING SIZE):
 *    - Client có thể gửi `size=1000000` cố tình gây Out-Of-Memory (OOM DoS).
 *    - Ta giới hạn cứng size về khoảng [1, 100] tại Service mà không quăng lỗi 400 hay 500,
 *      vừa bảo vệ server vừa tối ưu trải nghiệm client.
 * 4. XỬ LÝ DUY NHẤT SLUG & SKU:
 *    - Kiểm tra trước ở tầng Java để trả về lỗi 409 Conflict tường minh cho client.
 *    - Bắt tiếp DataIntegrityViolationException để phòng ngừa Race Condition khi 2 request ghi đồng thời.
 * 5. PUBLIC QUERY AN TOÀN:
 *    - Mọi truy vấn công khai bắt buộc lọc `isDeleted = false` bằng JPA Specification, tránh rò rỉ dữ liệu đã xóa mềm.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    // =========================================================
    // 1. PUBLIC: DANH SÁCH SẢN PHẨM (PHÂN TRANG + FILTER)
    // =========================================================
    @Override
    public PageResponse<ProductListItemResponse> getProducts(
            int page,
            int size,
            String categorySlug,
            String search,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sort
    ) {
        // TẠI SAO PHẢI CLAMP SIZE:
        // Không bao giờ tin tưởng trực tiếp tham số do client gửi. Nếu client gửi page âm hoặc size = 999999,
        // server sẽ load một khối lượng lớn bản ghi lên RAM dẫn tới OutOfMemoryError.
        // Ta clamp page >= 0 và size trong khoảng [1, 100]. Không throw exception để trải nghiệm người dùng liền mạch.
        int clampedPage = Math.max(0, page);
        int clampedSize = Math.max(1, Math.min(size, 100));

        Sort sortOrder = resolveSort(sort);
        Pageable pageable = PageRequest.of(clampedPage, clampedSize, sortOrder);

        // Xây dựng điều kiện lọc bằng JPA Specification linh hoạt
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // QUY TẮC BẢO MẬT 5: Public query BẮT BUỘC chỉ trả về bản ghi chưa xóa mềm (isDeleted = false)
            predicates.add(cb.isFalse(root.get("isDeleted")));

            // Lọc theo Danh mục (nếu có)
            if (categorySlug != null && !categorySlug.isBlank()) {
                Join<Product, Category> categoryJoin = root.join("category", JoinType.INNER);
                predicates.add(cb.equal(categoryJoin.get("slug"), categorySlug.trim()));
                predicates.add(cb.isFalse(categoryJoin.get("isDeleted")));
            }

            // Tìm kiếm đa trường (tên, mã SKU, mô tả ngắn)
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate skuLike = cb.like(cb.lower(root.get("sku")), searchPattern);
                Predicate shortDescLike = cb.like(cb.lower(root.get("shortDescription")), searchPattern);
                predicates.add(cb.or(nameLike, skuLike, shortDescLike));
            }

            // Lọc theo khoảng giá (minPrice, maxPrice)
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<ProductListItemResponse> content = productPage.getContent().stream()
                .map(ProductServiceImpl::toListItemResponse)
                .toList();

        return PageResponse.<ProductListItemResponse>builder()
                .content(content)
                .page(productPage.getNumber())
                .size(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .build();
    }

    // =========================================================
    // 2. PUBLIC: CHI TIẾT SẢN PHẨM THEO SLUG
    // =========================================================
    @Override
    public ProductDetailResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy sản phẩm có slug: {}", slug);
                    return new AppException(ErrorCode.PRODUCT_NOT_FOUND);
                });

        return toDetailResponse(product);
    }

    // =========================================================
    // 3. ADMIN: TẠO MỚI SẢN PHẨM
    // =========================================================
    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ProductDetailResponse createProduct(CreateProductRequest request) {
        // 1. Kiểm tra tồn tại của Category và không bị xóa mềm
        Category category = categoryRepository.findByIdAndIsDeletedFalse(request.getCategoryId())
                .orElseThrow(() -> {
                    log.warn("Tạo sản phẩm thất bại - Danh mục không tồn tại: {}", request.getCategoryId());
                    return new AppException(ErrorCode.CATEGORY_NOT_FOUND);
                });

        // 2. Kiểm tra tính duy nhất của slug và sku ở tầng Service để trả lỗi 409 tường minh
        if (productRepository.existsBySlug(request.getSlug().trim())) {
            log.info("Tạo sản phẩm thất bại - Slug đã tồn tại: {}", request.getSlug());
            throw new AppException(ErrorCode.PRODUCT_SLUG_EXISTED);
        }

        if (productRepository.existsBySku(request.getSku().trim())) {
            log.info("Tạo sản phẩm thất bại - SKU đã tồn tại: {}", request.getSku());
            throw new AppException(ErrorCode.PRODUCT_SKU_EXISTED);
        }

        // 3. BẢO MẬT: Sanitize description bằng Jsoup TRƯỚC KHI LƯU
        // TẠI SAO: Ngăn chặn Stored XSS triệt để, loại bỏ thẻ <script>, iframe, on* attributes...
        String safeDescriptionHtml = sanitizeHtmlDescription(request.getDescription());

        String currentUser = currentUsername();

        Product product = Product.builder()
                .name(request.getName().trim())
                .slug(request.getSlug().trim().toLowerCase())
                .category(category)
                .shortDescription(normalizeOptionalText(request.getShortDescription()))
                .description(safeDescriptionHtml)
                .price(request.getPrice())
                .sku(request.getSku().trim().toUpperCase())
                .inStock(request.getInStock() == null || request.getInStock())
                .createdBy(currentUser)
                .updatedBy(currentUser)
                .build();

        Product savedProduct = saveWithUniqueConflictHandling(product);
        log.info("ADMIN [{}] đã tạo sản phẩm thành công: id={}, sku={}", currentUser, savedProduct.getId(), savedProduct.getSku());
        return toDetailResponse(savedProduct);
    }

    // =========================================================
    // 4. ADMIN: CẬP NHẬT SẢN PHẨM
    // =========================================================
    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ProductDetailResponse updateProduct(String id, UpdateProductRequest request) {
        Product product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Category category = categoryRepository.findByIdAndIsDeletedFalse(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Kiểm tra trùng lặp slug/sku với các sản phẩm khác (ngoại trừ chính sản phẩm đang sửa)
        if (productRepository.existsBySlugAndIdNot(request.getSlug().trim(), id)) {
            throw new AppException(ErrorCode.PRODUCT_SLUG_EXISTED);
        }

        if (productRepository.existsBySkuAndIdNot(request.getSku().trim(), id)) {
            throw new AppException(ErrorCode.PRODUCT_SKU_EXISTED);
        }

        // BẢO MẬT: Bắt buộc sanitize description kể cả trong nghiệp vụ update
        String safeDescriptionHtml = sanitizeHtmlDescription(request.getDescription());

        product.setName(request.getName().trim());
        product.setSlug(request.getSlug().trim().toLowerCase());
        product.setCategory(category);
        product.setShortDescription(normalizeOptionalText(request.getShortDescription()));
        product.setDescription(safeDescriptionHtml);
        product.setPrice(request.getPrice());
        product.setSku(request.getSku().trim().toUpperCase());
        if (request.getInStock() != null) {
            product.setInStock(request.getInStock());
        }
        product.setUpdatedBy(currentUsername());

        Product savedProduct = saveWithUniqueConflictHandling(product);
        log.info("ADMIN [{}] đã cập nhật sản phẩm: id={}", currentUsername(), savedProduct.getId());
        return toDetailResponse(savedProduct);
    }

    // =========================================================
    // 5. ADMIN: XÓA MỀM SẢN PHẨM
    // =========================================================
    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void softDeleteProduct(String id) {
        Product product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Xóa mềm: không xóa vật lý trong database để bảo toàn lịch sử đơn hàng và tham chiếu khóa ngoại
        product.setIsDeleted(true);
        product.setUpdatedBy(currentUsername());
        productRepository.save(product);
        log.info("ADMIN [{}] đã xóa mềm sản phẩm: id={}", currentUsername(), id);
    }

    // =========================================================
    // 6. ADMIN: UPLOAD ẢNH CHO SẢN PHẨM
    // =========================================================
    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public List<ProductImageResponse> uploadProductImages(String productId, List<MultipartFile> files) {
        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (files == null || files.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        long currentImageCount = productImageRepository.countByProductId(productId);
        int nextOrder = (int) currentImageCount;

        List<ProductImageResponse> uploadedResponses = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            // FileStorageService sẽ kiểm tra magic bytes, kích thước và sinh tên file UUID ngẫu nhiên
            String imageUrl = fileStorageService.storeProductImage(file);

            ProductImage productImage = ProductImage.builder()
                    .product(product)
                    .url(imageUrl)
                    .sortOrder(nextOrder++)
                    .createdBy(currentUsername())
                    .updatedBy(currentUsername())
                    .build();

            ProductImage savedImage = productImageRepository.save(productImage);
            product.getImages().add(savedImage);

            uploadedResponses.add(ProductImageResponse.builder()
                    .id(savedImage.getId())
                    .url(savedImage.getUrl())
                    .sortOrder(savedImage.getSortOrder())
                    .build());
        }

        log.info("ADMIN [{}] đã tải lên {} ảnh mới cho sản phẩm id={}", currentUsername(), uploadedResponses.size(), productId);
        return uploadedResponses;
    }

    // =========================================================
    // PRIVATE HELPERS & SECURITY UTILITIES
    // =========================================================

    /**
     * TẠI SAO: Sanitize HTML bằng Jsoup.
     * Sử dụng Safelist.relaxed(): cho phép các định dạng văn bản giàu (p, strong, em, table, a, img, ul, ol...)
     * nhưng tự động loại bỏ triệt để:
     * - Các thẻ thực thi mã: <script>, <object>, <embed>, <iframe>
     * - Các thuộc tính lắng nghe sự kiện inline: onload, onerror, onclick, onmouseover...
     * - Các scheme URL độc hại như "javascript:alert(1)"
     */
    private static String sanitizeHtmlDescription(String htmlInput) {
        return HtmlSanitizer.sanitize(htmlInput);
    }

    /**
     * Bắt lỗi vi phạm ràng buộc cơ sở dữ liệu để phòng ngừa Race Condition.
     * TẠI SAO: Hai request cùng đến một lúc có thể vượt qua bước `existsBySlug` ở tầng Java.
     * Database constraint lúc này sẽ ném ra DataIntegrityViolationException. Ta dịch nó thành
     * AppException có mã HTTP 409 Conflict thay vì để lộ lỗi 500 ra ngoài.
     */
    private Product saveWithUniqueConflictHandling(Product product) {
        try {
            return productRepository.saveAndFlush(product);
        } catch (DataIntegrityViolationException exception) {
            Throwable cause = exception;
            while (cause != null) {
                if (cause instanceof ConstraintViolationException constraintViolation) {
                    String constraintName = constraintViolation.getConstraintName();
                    if (constraintName != null) {
                        String lowerConstraint = constraintName.toLowerCase();
                        if (lowerConstraint.contains("uk_products_slug") || lowerConstraint.contains("slug")) {
                            throw new AppException(ErrorCode.PRODUCT_SLUG_EXISTED);
                        }
                        if (lowerConstraint.contains("uk_products_sku") || lowerConstraint.contains("sku")) {
                            throw new AppException(ErrorCode.PRODUCT_SKU_EXISTED);
                        }
                    }
                }
                cause = cause.getCause();
            }
            throw exception;
        }
    }

    private static Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sort.trim().toLowerCase()) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    private static String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null) ? auth.getName() : "anonymous";
    }

    private static ProductListItemResponse toListItemResponse(Product product) {
        String thumbnailUrl = null;
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            thumbnailUrl = product.getImages().getFirst().getUrl();
        }

        return ProductListItemResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .shortDescription(product.getShortDescription())
                .price(product.getPrice())
                .sku(product.getSku())
                .inStock(Boolean.TRUE.equals(product.getInStock()))
                .thumbnailUrl(thumbnailUrl)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private static ProductDetailResponse toDetailResponse(Product product) {
        List<ProductImageResponse> imageResponses = product.getImages() == null ? List.of() :
                product.getImages().stream()
                        .map(img -> ProductImageResponse.builder()
                                .id(img.getId())
                                .url(img.getUrl())
                                .sortOrder(img.getSortOrder())
                                .build())
                        .toList();

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .shortDescription(product.getShortDescription())
                .description(product.getDescription())
                .price(product.getPrice())
                .sku(product.getSku())
                .inStock(Boolean.TRUE.equals(product.getInStock()))
                .images(imageResponses)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .createdBy(product.getCreatedBy())
                .updatedBy(product.getUpdatedBy())
                .build();
    }
}
