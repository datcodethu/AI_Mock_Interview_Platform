package com.example.backend.repository;

import com.example.backend.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository thao tác dữ liệu cho BlogPost.
 * Kế thừa JpaSpecificationExecutor để hỗ trợ truy vấn lọc động và phân trang tối ưu ở tầng database.
 */
@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, String>, JpaSpecificationExecutor<BlogPost> {

    Optional<BlogPost> findBySlugAndIsDeletedFalse(String slug);

    Optional<BlogPost> findByIdAndIsDeletedFalse(String id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);
}
