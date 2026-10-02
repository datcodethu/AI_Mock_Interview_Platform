package com.example.backend.repository;

import com.example.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.images WHERE p.slug = :slug AND p.isDeleted = false")
    Optional<Product> findBySlugAndIsDeletedFalse(@Param("slug") String slug);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.images WHERE p.id = :id AND p.isDeleted = false")
    Optional<Product> findByIdAndIsDeletedFalse(@Param("id") String id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, String id);
}
