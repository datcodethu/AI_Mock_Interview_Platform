package com.example.backend;

import com.example.backend.dto.request.CreateCategoryRequest;
import com.example.backend.entity.Category;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.service.CategoryServiceImpl;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CategoryServiceConcurrencyTests {

    @Test
    void concurrentSlugInsertIsTranslatedToConflict() {
        CategoryRepository repository = mock(CategoryRepository.class);
        when(repository.existsBySlug("ban-ghe")).thenReturn(false);
        when(repository.saveAndFlush(any(Category.class)))
                .thenThrow(new DataIntegrityViolationException(
                        "uk_categories_slug",
                        new ConstraintViolationException("duplicate slug", new SQLException(), "uk_categories_slug")));

        CreateCategoryRequest request = new CreateCategoryRequest();
        request.setName("Bàn ghế");
        request.setSlug("ban-ghe");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        "not-used",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        try {
            AppException exception = assertThrows(
                    AppException.class,
                    () -> new CategoryServiceImpl(repository).createCategory(request));

            assertEquals(ErrorCode.CATEGORY_SLUG_EXISTED, exception.getErrorCode());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
