package com.example.backend.repository;

import com.example.backend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, String> {
    List<ProductImage> findByProductIdOrderBySortOrderAsc(String productId);
    long countByProductId(String productId);
}
