package com.example.backend.repository;

import com.example.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {

    List<Category> findAllByIsDeletedFalseOrderByNameAsc();

    Optional<Category> findBySlugAndIsDeletedFalse(String slug);

    Optional<Category> findByIdAndIsDeletedFalse(String id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);
}
