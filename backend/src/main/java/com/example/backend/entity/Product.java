package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity đại diện cho Sản phẩm (Product).
 * Kế thừa BaseEntity để tận dụng các trường audit (createdAt, updatedAt,
 * createdBy, updatedBy)
 * và cơ chế xóa mềm (isDeleted).
 *
 * QUYẾT ĐỊNH BẢO MẬT & THIẾT KẾ:
 * 1. uk_products_slug & uk_products_sku: Ràng buộc unique được khai báo ở cả
 * tầng Database (@Table UniqueConstraint / @Column)
 * và tầng Service. Tầng Service kiểm tra trước để trả về mã lỗi thân thiện (409
 * Conflict), nhưng ràng buộc DB
 * là chốt chặn cuối cùng ngăn chặn Race Condition (2 transaction commit đồng
 * thời).
 * 2. description lưu trữ HTML giàu tính năng (rich text): Được sanitize bằng
 * Jsoup trong Service trước khi persist.
 * 3. Quan hệ 1-N với ProductImage: Không lưu mảng URL trong 1 cột varchar/text
 * (chống vi phạm chuẩn 1NF và dễ quản lý thứ tự sortOrder).
 */
@Entity
@Table(name = "products", uniqueConstraints = {
        @UniqueConstraint(name = "uk_products_slug", columnNames = "slug"),
        @UniqueConstraint(name = "uk_products_sku", columnNames = "sku")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 250, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category; // quan hệ nhiều sản phẩm thuộc 1 danh mục

    @Column(name = "short_description", length = 1000)
    private String shortDescription;

    /**
     * Nội dung mô tả chi tiết định dạng HTML.
     * BẮT BUỘC sanitize bằng Jsoup trước khi lưu DB để triệt tiêu nguy cơ Stored
     * XSS.
     */
    @Lob // Lob là một annotation trong JPA (Java Persistence API) được sử dụng để chỉ
         // định rằng một trường dữ liệu trong entity sẽ được lưu trữ dưới dạng Large
         // Object (LOB) trong cơ sở dữ liệu. LOB thường được sử dụng để lưu trữ dữ liệu
         // lớn như văn bản dài, hình ảnh, video hoặc các tệp nhị phân khác.
    @Column(columnDefinition = "LONGTEXT")
    private String description;

    /**
     * Giá sản phẩm. Nullable: khi null mang ý nghĩa "liên hệ báo giá".
     * Dùng BigDecimal thay vì double/float để tránh sai số dấu phẩy động trong
     * nghiệp vụ tài chính.
     */
    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 100, unique = true)
    private String sku; // ý nghĩa của trường này là "Stock Keeping Unit" - mã định danh duy nhất cho
                        // sản phẩm trong kho, giúp quản lý tồn kho và theo dõi sản phẩm bằng cách phân
                        // biệt các biến thể của sản phẩm (như màu sắc, kích thước) và hỗ trợ quản lý
                        // hàng tồn kho.

    @Builder.Default
    @Column(name = "in_stock", nullable = false)
    private Boolean inStock = true;

    @Builder.Default
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ProductImage> images = new ArrayList<>();

    public void addImage(ProductImage image) {
        images.add(image);
        image.setProduct(this);
    }

    public void removeImage(ProductImage image) {
        images.remove(image);
        image.setProduct(null);
    }
}
