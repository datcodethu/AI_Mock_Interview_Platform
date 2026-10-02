package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

/**
 * Entity đại diện cho Bài viết / Tin tức (BlogPost).
 * Kế thừa BaseEntity để tận dụng các trường auditing (createdAt, updatedAt,
 * createdBy, updatedBy) và cờ xóa mềm (isDeleted).
 *
 * QUYẾT ĐỊNH BẢO MẬT & THIẾT KẾ:
 * 1. uk_blog_posts_slug: Ràng buộc unique được khai báo ở cả tầng Database
 *    (@Table UniqueConstraint / @Column) và tầng Service. Tầng Service kiểm tra trước để trả về
 *    mã lỗi 409 Conflict tường minh, nhưng ràng buộc DB là chốt chặn cuối cùng ngăn chặn Race Condition.
 * 2. content lưu trữ HTML rich-text: Bắt buộc được sanitize bằng Jsoup trong Service trước khi persist
 *    để triệt tiêu nguy cơ Stored XSS.
 * 3. tags: Được mapping qua @ElementCollection với bảng phụ `blog_post_tags`, chuẩn hóa thành Set<String>
 *    để loại bỏ các tag trùng lặp và không cần tạo entity Tag riêng khi chưa có yêu cầu nghiệp vụ phức tạp.
 */
@Entity
@Table(name = "blog_posts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_blog_posts_slug", columnNames = "slug")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BlogPost extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(nullable = false, length = 250, unique = true)
    private String slug;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(length = 500)
    private String excerpt;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "blog_post_tags",
            joinColumns = @JoinColumn(name = "blog_post_id", foreignKey = @ForeignKey(name = "fk_blog_post_tags_post"))
    )
    @Column(name = "tag", length = 50, nullable = false)
    private Set<String> tags = new HashSet<>();
}
