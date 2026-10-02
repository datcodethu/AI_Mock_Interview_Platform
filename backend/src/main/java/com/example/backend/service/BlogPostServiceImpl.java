package com.example.backend.service;

import com.example.backend.dto.request.BlogPostRequest;
import com.example.backend.dto.response.BlogPostDetailResponse;
import com.example.backend.dto.response.BlogPostSummaryResponse;
import com.example.backend.dto.response.PageResponse;
import com.example.backend.entity.BlogPost;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.BlogPostRepository;
import com.example.backend.utils.HtmlSanitizer;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ nghiệp vụ của module Bài viết / Tin tức (BlogPost).
 *
 * NGUYÊN TẮC BẢO MẬT & KIẾN TRÚC:
 * 1. DEFENSE-IN-DEPTH: Phân quyền @PreAuthorize("hasRole('ADMIN')") được áp dụng ở cả Controller và Service.
 * 2. CHỐNG STORED XSS:
 *    - Toàn bộ nội dung `content` phải đi qua HtmlSanitizer (Jsoup Safelist.relaxed()).
 *    - Trường `excerpt` được loại bỏ toàn bộ HTML (chỉ giữ plain text) và giới hạn nghiêm ngặt <= 300 ký tự.
 * 3. BẢO VỆ URL ẢNH BÌA:
 *    - `coverImageUrl` chỉ chấp nhận các giao thức hợp lệ (http://, https://, /uploads/) để ngăn ngừa SSRF
 *      và scheme độc hại như javascript:.
 * 4. XỬ LÝ DUY NHẤT SLUG & RACE CONDITION:
 *    - Kiểm tra trước ở tầng Java, đồng thời bắt DataIntegrityViolationException để chuyển thành mã lỗi 409 Conflict.
 * 5. TRUY VẤN CÔNG KHAI AN TOÀN:
 *    - Tự động lọc `isDeleted = false` và giới hạn kích thước phân trang [1, 50].
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BlogPostServiceImpl implements BlogPostService {

    private final BlogPostRepository blogPostRepository;

    // =========================================================
    // 1. PUBLIC: DANH SÁCH BÀI VIẾT (PHÂN TRANG + FILTER)
    // =========================================================
    @Override
    public PageResponse<BlogPostSummaryResponse> getBlogPosts(
            int page,
            int size,
            String search,
            String tag,
            String sort
    ) {
        // Clamping page >= 0 và size trong khoảng [1, 50] để tránh OOM DoS
        int clampedPage = Math.max(0, page);
        int clampedSize = Math.max(1, Math.min(size, 50));

        Sort sortOrder = resolveSort(sort);
        Pageable pageable = PageRequest.of(clampedPage, clampedSize, sortOrder);

        Specification<BlogPost> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Chỉ lấy bài viết chưa xóa mềm
            predicates.add(cb.isFalse(root.get("isDeleted")));

            // Tìm kiếm theo từ khóa (tiêu đề, trích đoạn)
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate excerptLike = cb.like(cb.lower(root.get("excerpt")), pattern);
                predicates.add(cb.or(titleLike, excerptLike));
            }

            // Lọc theo tag
            if (tag != null && !tag.isBlank()) {
                Join<BlogPost, String> tagJoin = root.join("tags");
                predicates.add(cb.equal(cb.lower(tagJoin), tag.trim().toLowerCase()));
                if (query != null) {
                    query.distinct(true);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<BlogPost> postPage = blogPostRepository.findAll(spec, pageable);

        List<BlogPostSummaryResponse> content = postPage.getContent().stream()
                .map(BlogPostServiceImpl::toSummaryResponse)
                .toList();

        return PageResponse.<BlogPostSummaryResponse>builder()
                .content(content)
                .page(postPage.getNumber())
                .size(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .build();
    }

    // =========================================================
    // 2. PUBLIC: CHI TIẾT BÀI VIẾT THEO SLUG
    // =========================================================
    @Override
    public BlogPostDetailResponse getBlogPostBySlug(String slug) {
        BlogPost post = blogPostRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy bài viết có slug: {}", slug);
                    return new AppException(ErrorCode.BLOG_POST_NOT_FOUND);
                });

        return toDetailResponse(post);
    }

    // =========================================================
    // 3. ADMIN: TẠO MỚI BÀI VIẾT
    // =========================================================
    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public BlogPostDetailResponse createBlogPost(BlogPostRequest request) {
        String slug = request.getSlug().trim().toLowerCase();

        // 1. Kiểm tra tính duy nhất của slug
        if (blogPostRepository.existsBySlug(slug)) {
            log.info("Tạo bài viết thất bại - Slug đã tồn tại: {}", slug);
            throw new AppException(ErrorCode.BLOG_POST_SLUG_EXISTED);
        }

        // 2. Validate URL ảnh bìa
        validateCoverImageUrl(request.getCoverImageUrl());

        // 3. Validate và chuẩn hóa excerpt (tối đa 300 ký tự, chuyển sang plain text)
        String safeExcerpt = processExcerpt(request.getExcerpt());

        // 4. Sanitize rich-text content bằng Jsoup
        String safeContent = HtmlSanitizer.sanitize(request.getContent());
        if (safeContent == null || safeContent.isBlank()) {
            throw new AppException(ErrorCode.INVALID_BLOG_CONTENT);
        }

        // 5. Chuẩn hóa tags
        Set<String> cleanTags = cleanTags(request.getTags());

        String currentUser = currentUsername();

        BlogPost blogPost = BlogPost.builder()
                .title(request.getTitle().trim())
                .slug(slug)
                .coverImageUrl(normalizeOptionalText(request.getCoverImageUrl()))
                .excerpt(safeExcerpt)
                .content(safeContent)
                .tags(cleanTags)
                .createdBy(currentUser)
                .updatedBy(currentUser)
                .build();

        BlogPost savedPost = saveWithUniqueConflictHandling(blogPost);
        log.info("ADMIN [{}] đã tạo bài viết thành công: id={}, slug={}", currentUser, savedPost.getId(), savedPost.getSlug());
        return toDetailResponse(savedPost);
    }

    // =========================================================
    // 4. ADMIN: CẬP NHẬT BÀI VIẾT
    // =========================================================
    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public BlogPostDetailResponse updateBlogPost(String id, BlogPostRequest request) {
        BlogPost post = blogPostRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.BLOG_POST_NOT_FOUND));

        String newSlug = request.getSlug().trim().toLowerCase();

        // Kiểm tra slug không trùng với bài viết khác (cho phép giữ nguyên slug của chính nó)
        if (blogPostRepository.existsBySlugAndIdNot(newSlug, id)) {
            log.info("Cập nhật bài viết thất bại - Slug đã tồn tại: {}", newSlug);
            throw new AppException(ErrorCode.BLOG_POST_SLUG_EXISTED);
        }

        // Validate URL ảnh bìa
        validateCoverImageUrl(request.getCoverImageUrl());

        // Validate và chuẩn hóa excerpt
        String safeExcerpt = processExcerpt(request.getExcerpt());

        // Sanitize rich-text content
        String safeContent = HtmlSanitizer.sanitize(request.getContent());
        if (safeContent == null || safeContent.isBlank()) {
            throw new AppException(ErrorCode.INVALID_BLOG_CONTENT);
        }

        // Chuẩn hóa tags
        Set<String> cleanTags = cleanTags(request.getTags());

        post.setTitle(request.getTitle().trim());
        post.setSlug(newSlug);
        post.setCoverImageUrl(normalizeOptionalText(request.getCoverImageUrl()));
        post.setExcerpt(safeExcerpt);
        post.setContent(safeContent);
        post.setTags(cleanTags);
        post.setUpdatedBy(currentUsername());

        BlogPost savedPost = saveWithUniqueConflictHandling(post);
        log.info("ADMIN [{}] đã cập nhật bài viết id={}, slug={}", currentUsername(), savedPost.getId(), savedPost.getSlug());
        return toDetailResponse(savedPost);
    }

    // =========================================================
    // 5. ADMIN: XÓA MỀM BÀI VIẾT
    // =========================================================
    @Override
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteBlogPost(String id) {
        BlogPost post = blogPostRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.BLOG_POST_NOT_FOUND));

        post.setIsDeleted(true);
        post.setUpdatedBy(currentUsername());
        blogPostRepository.save(post);
        log.info("ADMIN [{}] đã xóa mềm bài viết id={}", currentUsername(), id);
    }

    // =========================================================
    // PRIVATE HELPERS & SECURITY UTILITIES
    // =========================================================

    private static void validateCoverImageUrl(String url) {
        if (url != null && !url.isBlank() && !HtmlSanitizer.isValidImageUrl(url)) {
            throw new AppException(ErrorCode.INVALID_COVER_IMAGE_URL);
        }
    }

    private static String processExcerpt(String rawExcerpt) {
        if (rawExcerpt == null || rawExcerpt.isBlank()) {
            return null;
        }
        // Ép kiểu về plain text để loại bỏ hoàn toàn các thẻ HTML không an toàn trong excerpt
        String plainText = HtmlSanitizer.toPlainText(rawExcerpt);
        if (plainText.length() > 300) {
            throw new AppException(ErrorCode.INVALID_EXCERPT_LENGTH);
        }
        return plainText;
    }

    private static Set<String> cleanTags(Set<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return new HashSet<>();
        }
        return tags.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(t -> !t.isBlank())
                .limit(20) // Giới hạn tối đa 20 tags mỗi bài viết
                .collect(Collectors.toSet());
    }

    private BlogPost saveWithUniqueConflictHandling(BlogPost post) {
        try {
            return blogPostRepository.saveAndFlush(post);
        } catch (DataIntegrityViolationException ex) {
            Throwable cause = ex;
            while (cause != null) {
                if (cause instanceof ConstraintViolationException cv) {
                    String name = cv.getConstraintName();
                    if (name != null && (name.toLowerCase().contains("slug") || name.toLowerCase().contains("uk_blog_posts_slug"))) {
                        throw new AppException(ErrorCode.BLOG_POST_SLUG_EXISTED);
                    }
                }
                cause = cause.getCause();
            }
            throw ex;
        }
    }

    private static Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sort.trim().toLowerCase()) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "title_asc" -> Sort.by(Sort.Direction.ASC, "title");
            case "title_desc" -> Sort.by(Sort.Direction.DESC, "title");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    private static String normalizeOptionalText(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null) ? auth.getName() : "anonymous";
    }

    private static BlogPostSummaryResponse toSummaryResponse(BlogPost post) {
        return BlogPostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .coverImageUrl(post.getCoverImageUrl())
                .excerpt(post.getExcerpt())
                .tags(post.getTags() != null ? new HashSet<>(post.getTags()) : Collections.emptySet())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private static BlogPostDetailResponse toDetailResponse(BlogPost post) {
        return BlogPostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .coverImageUrl(post.getCoverImageUrl())
                .excerpt(post.getExcerpt())
                .content(post.getContent())
                .tags(post.getTags() != null ? new HashSet<>(post.getTags()) : Collections.emptySet())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
