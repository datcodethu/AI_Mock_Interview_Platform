package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Entity lưu từng hình ảnh riêng lẻ của Sản phẩm.
 *
 * THIẾT KẾ:
 * - Chuẩn hóa 1NF: Tách ảnh thành bảng riêng thay vì lưu mảng JSON hay chuỗi
 * phân cách bởi dấu phẩy,
 * giúp kiểm soát tính toàn vẹn, sắp xếp thứ tự hiển thị (sortOrder) và hỗ trợ
 * quản lý upload/xóa độc lập.
 */
@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductImage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 1000)
    private String url;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0; // dùng để sắp xếp thứ tự hiển thị ảnh trong danh sách ảnh của sản phẩm
}
