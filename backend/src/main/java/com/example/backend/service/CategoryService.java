package com.example.backend.service;

import com.example.backend.dto.request.CreateCategoryRequest;
import com.example.backend.dto.request.UpdateCategoryRequest;
import com.example.backend.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getActiveCategories();

    CategoryResponse getActiveCategoryBySlug(String slug);

    List<CategoryResponse> getAllCategoriesForAdmin();

    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse updateCategory(String id, UpdateCategoryRequest request);

    void softDeleteCategory(String id);
}
