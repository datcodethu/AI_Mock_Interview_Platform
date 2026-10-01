package com.example.backend.service;

import com.example.backend.dto.request.CreateCategoryRequest;
import com.example.backend.dto.request.UpdateCategoryRequest;
import com.example.backend.dto.response.CategoryResponse;
import com.example.backend.entity.Category;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findAllByIsDeletedFalseOrderByNameAsc()
                .stream()
                .map(CategoryServiceImpl::toResponse)
                .toList();
    }

    @Override
    public CategoryResponse getActiveCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return toResponse(category);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public List<CategoryResponse> getAllCategoriesForAdmin() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(CategoryServiceImpl::toResponse)
                .toList();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(request.getSlug())
                .description(normalizeOptionalText(request.getDescription()))
                .iconUrl(normalizeOptionalText(request.getIconUrl()))
                .createdBy(currentUsername())
                .updatedBy(currentUsername())
                .build();

        return toResponse(saveWithSlugConflictHandling(category));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CategoryResponse updateCategory(String id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (categoryRepository.existsBySlugAndIdNot(request.getSlug(), id)) {
            throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
        }

        category.setName(request.getName().trim());
        category.setSlug(request.getSlug());
        if (request.getDescription() != null) {
            category.setDescription(normalizeOptionalText(request.getDescription()));
        }
        if (request.getIconUrl() != null) {
            category.setIconUrl(normalizeOptionalText(request.getIconUrl()));
        }
        category.setUpdatedBy(currentUsername());

        return toResponse(saveWithSlugConflictHandling(category));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void softDeleteCategory(String id) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        category.setIsDeleted(true);
        category.setUpdatedBy(currentUsername());
        categoryRepository.save(category);
    }

    private Category saveWithSlugConflictHandling(Category category) {
        try {
            return categoryRepository.saveAndFlush(category);
        } catch (DataIntegrityViolationException exception) {
            if (isSlugConstraintViolation(exception)) {
                throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
            }
            throw exception;
        }
    }

    private static boolean isSlugConstraintViolation(DataIntegrityViolationException exception) {
        Throwable cause = exception;
        while (cause != null) {
            if (cause instanceof ConstraintViolationException constraintViolation) {
                return "uk_categories_slug".equalsIgnoreCase(constraintViolation.getConstraintName());
            }
            cause = cause.getCause();
        }
        return false;
    }

    private static String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private static CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .createdBy(category.getCreatedBy())
                .updatedBy(category.getUpdatedBy())
                .isDeleted(Boolean.TRUE.equals(category.getIsDeleted()))
                .build();
    }
}
