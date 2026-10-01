package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.CategoryResponse;
import com.example.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getActiveCategories() {
        return ApiResponse.<List<CategoryResponse>>builder()
                .code(200)
                .message("OK")
                .data(categoryService.getActiveCategories())
                .build();
    }

    @GetMapping("/{slug}")
    public ApiResponse<CategoryResponse> getActiveCategoryBySlug(@PathVariable String slug) {
        return ApiResponse.<CategoryResponse>builder()
                .code(200)
                .message("OK")
                .data(categoryService.getActiveCategoryBySlug(slug))
                .build();
    }
}
