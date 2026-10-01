# Module Category (Nhóm ngành hàng) --- E-commerce

Tài liệu mô tả module Category từ nghiệp vụ, API, database, Spring Boot
backend, React TypeScript frontend đến security, xử lý lỗi và kiểm thử.
Ví dụ sử dụng Spring Boot 3+/Java 21, Spring Security, Spring Data JPA,
React + TypeScript, Axios và TanStack Query. Cần điều chỉnh package,
response contract, database và cấu hình JWT cho khớp dự án thực tế.

------------------------------------------------------------------------

## 1. Mục tiêu và nghiệp vụ

Category là nhóm dùng để phân loại sản phẩm, ví dụ:

-   Giường ngủ --- `giuong-ngu`
-   Tủ quần áo --- `tu-quan-ao`
-   Bàn ghế --- `ban-ghe`
-   Đèn trang trí --- `den-trang-tri`

Hai nhóm người dùng chính:

-   **Khách hàng/USER:** xem danh sách và chi tiết danh mục.
-   **ADMIN:** tạo, sửa, xóa mềm danh mục.

Nguyên tắc quan trọng: Frontend chỉ hỗ trợ trải nghiệm. Backend phải xác
thực, phân quyền và kiểm tra nghiệp vụ cho mọi request. Ẩn nút Xóa ở UI
không bảo vệ được API.

### 1.1. Trường dữ liệu

  Trường          Kiểu đề xuất   Ý nghĩa
  --------------- -------------- --------------------------------------
  `id`            UUID           Khóa chính, dùng cho quan hệ dữ liệu
  `name`          VARCHAR(150)   Tên hiển thị
  `slug`          VARCHAR(180)   Định danh thân thiện với URL
  `description`   TEXT           Mô tả
  `icon_url`      VARCHAR(500)   URL ảnh/icon
  `is_deleted`    BOOLEAN        Đánh dấu xóa mềm
  `created_at`    TIMESTAMP      Thời điểm tạo
  `updated_at`    TIMESTAMP      Thời điểm cập nhật

Ví dụ response:

``` json
{
  "id": "c7d1a21e-3e22-4b21-8b30-22c77a1a1001",
  "name": "Giường ngủ",
  "slug": "giuong-ngu",
  "description": "Các loại giường ngủ gia đình",
  "iconUrl": "https://cdn.example.com/categories/bed.png"
}
```

Phân biệt: - `id`: định danh ổn định trong database. - `slug`: định danh
dùng trên URL, ví dụ `/categories/giuong-ngu`. - `name`: nội dung hiển
thị, có thể thay đổi.

### 1.2. Quy tắc nghiệp vụ cần thống nhất

1.  `name` bắt buộc, nhưng có nhất thiết phải duy nhất hay không cần
    quyết định.
2.  `slug` phải duy nhất theo chính sách đã chọn.
3.  Xóa mềm không xóa bản ghi vật lý.
4.  API public không trả danh mục đã xóa.
5.  Cần xác định chính sách khi danh mục đang được Product sử dụng.
6.  Cần xác định slug có được tái sử dụng sau khi danh mục bị xóa mềm
    không.
7.  `iconUrl` nên giới hạn giao thức/host được chấp nhận nếu nghiệp vụ
    yêu cầu.

Đề xuất MVP: không xóa vật lý; không cho xóa danh mục còn sản phẩm liên
kết hoặc yêu cầu chuyển sản phẩm trước; không tái sử dụng slug để đơn
giản hóa URL và ràng buộc dữ liệu.

------------------------------------------------------------------------

## 2. REST API

  ---------------------------------------------------------------------------------------
  Method            Endpoint                          Quyền             Mục đích
  ----------------- --------------------------------- ----------------- -----------------
  GET               `/api/v1/categories`              Public            Danh sách danh
                                                                        mục đang hoạt
                                                                        động

  GET               `/api/v1/categories/{slug}`       Public            Chi tiết theo
                                                                        slug

  POST              `/api/v1/admin/categories`        ADMIN             Tạo mới

  PUT               `/api/v1/admin/categories/{id}`   ADMIN             Cập nhật

  DELETE            `/api/v1/admin/categories/{id}`   ADMIN             Xóa mềm
  ---------------------------------------------------------------------------------------

### 2.1. GET danh sách

Request:

``` http
GET /api/v1/categories
```

Response mẫu:

``` json
{
  "code": 1000,
  "message": "Success",
  "result": [
    {
      "id": "c7d1a21e-3e22-4b21-8b30-22c77a1a1001",
      "name": "Giường ngủ",
      "slug": "giuong-ngu",
      "description": "Các loại giường ngủ",
      "iconUrl": "https://cdn.example.com/bed.png"
    }
  ]
}
```

Luồng: Frontend → Security cho phép public → Controller → Service →
Repository → database → map Entity sang DTO → JSON response.

### 2.2. GET chi tiết

``` http
GET /api/v1/categories/giuong-ngu
```

Nếu không tồn tại hoặc đã xóa mềm, trả `404 Not Found`. Không nên trả
bản ghi đã xóa cho người dùng public.

### 2.3. POST tạo mới

``` http
POST /api/v1/admin/categories
Authorization: Bearer <accessToken>
Content-Type: application/json
```

``` json
{
  "name": "Bàn ghế",
  "slug": "ban-ghe",
  "description": "Các loại bàn ghế nội thất",
  "iconUrl": "https://cdn.example.com/categories/table-chair.png"
}
```

Thành công: `201 Created`. Slug trùng: `409 Conflict`. Dữ liệu sai:
`400 Bad Request`. Chưa xác thực: `401`; đã xác thực nhưng không có
quyền: thường là `403`.

### 2.4. PUT cập nhật

``` http
PUT /api/v1/admin/categories/c7d1a21e-3e22-4b21-8b30-22c77a1a1001
```

``` json
{
  "name": "Giường ngủ cao cấp",
  "slug": "giuong-ngu-cao-cap",
  "description": "Các loại giường ngủ cao cấp",
  "iconUrl": "https://cdn.example.com/categories/premium-bed.png"
}
```

Khi kiểm tra slug mới, phải loại trừ chính danh mục đang cập nhật. Nếu
không, giữ nguyên slug cũ cũng có thể bị báo trùng.

### 2.5. DELETE xóa mềm

``` http
DELETE /api/v1/admin/categories/{id}
```

Xóa mềm cập nhật `is_deleted = true`, không xóa vật lý. API có thể trả
`204 No Content` và không có body. Tất cả API public liên quan phải lọc
danh mục đã xóa, bao gồm API Product, tìm kiếm và bộ lọc.

------------------------------------------------------------------------

## 3. Kiến trúc Backend

Cấu trúc package gợi ý:

``` text
src/main/java/com/example/backend/
├── category/
│   ├── controller/
│   │   ├── CategoryController.java
│   │   └── AdminCategoryController.java
│   ├── service/
│   │   ├── CategoryService.java
│   │   └── CategoryServiceImpl.java
│   ├── repository/CategoryRepository.java
│   ├── entity/Category.java
│   ├── dto/
│   │   ├── request/CategoryRequest.java
│   │   └── response/CategoryResponse.java
│   └── mapper/CategoryMapper.java
├── common/
│   ├── exception/
│   │   ├── ErrorCode.java
│   │   ├── AppException.java
│   │   └── GlobalExceptionHandler.java
│   └── response/ApiResponse.java
└── security/SecurityConfig.java
```

Có thể gộp hai Controller cho MVP. Tách Controller public và admin giúp
phân chia trách nhiệm, nhưng không thay thế được phân quyền tại Spring
Security.

### 3.1. Entity `Category.java`

``` java
package com.example.backend.category.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "categories",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_categories_slug",
        columnNames = "slug"
    )
)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 180)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Thêm getter/setter, hoặc dùng Lombok theo quy ước dự án.
}
```

Giải thích: - `@Entity`: JPA quản lý class như entity. - `@Table`: cấu
hình bảng và ràng buộc. - `@Id`: khóa chính. - `@GeneratedValue`: tạo
UUID. - `@PrePersist` / `@PreUpdate`: tự thiết lập thời gian tạo/cập
nhật. - Nếu dự án có `BaseEntity` chứa timestamp và `isDeleted`, nên kế
thừa để tránh lặp code. - Kiểm tra mapping UUID và kiểu cột theo
database thật, đặc biệt khi dùng MySQL thay vì PostgreSQL.

### 3.2. Request DTO

``` java
package com.example.backend.category.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 150, message = "Tên danh mục tối đa 150 ký tự")
    String name,

    @NotBlank(message = "Slug không được để trống")
    @Size(max = 180, message = "Slug tối đa 180 ký tự")
    String slug,

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    String description,

    @Size(max = 500, message = "URL icon tối đa 500 ký tự")
    String iconUrl
) {}
```

Không nhận thẳng Entity từ request vì client không được tự điều khiển
`id`, `isDeleted`, `createdAt` hoặc `updatedAt`. `@NotBlank` từ chối
`null`, chuỗi rỗng và chuỗi chỉ có khoảng trắng.

Java `record` là kiểu dữ liệu ngắn gọn, bất biến theo cấu trúc. Có thể
thay bằng class thường nếu dự án không dùng record.

### 3.3. Response DTO

``` java
package com.example.backend.category.dto.response;

import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(
    UUID id,
    String name,
    String slug,
    String description,
    String iconUrl,
    Instant createdAt,
    Instant updatedAt
) {}
```

Response DTO giúp chỉ định rõ dữ liệu được trả ra ngoài; không trả
trường quản trị không cần thiết.

### 3.4. Repository

``` java
package com.example.backend.category.repository;

import com.example.backend.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findAllByDeletedFalse();

    Optional<Category> findBySlugAndDeletedFalse(String slug);

    boolean existsBySlugAndDeletedFalse(String slug);

    boolean existsBySlugAndIdNotAndDeletedFalse(String slug, UUID id);
}
```

Spring Data JPA suy diễn truy vấn từ tên phương thức: -
`findAllByDeletedFalse`: danh sách chưa xóa. -
`findBySlugAndDeletedFalse`: tìm theo slug đang hoạt động. -
`existsBySlugAndDeletedFalse`: kiểm tra slug đang được dùng. -
`existsBySlugAndIdNotAndDeletedFalse`: kiểm tra slug thuộc danh mục
khác.

**Lưu ý chính sách slug:** Entity ví dụ có unique constraint trên toàn
bảng nên slug của bản ghi đã xóa vẫn không được tái sử dụng. Nếu muốn
tái sử dụng slug, cần thay đổi schema/index theo database; chỉ sửa truy
vấn kiểm tra là chưa đủ.

### 3.5. Service interface

``` java
package com.example.backend.category.service;

import com.example.backend.category.dto.request.CategoryRequest;
import com.example.backend.category.dto.response.CategoryResponse;
import java.util.List;
import java.util.UUID;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryBySlug(String slug);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(UUID id, CategoryRequest request);
    void deleteCategory(UUID id);
}
```

### 3.6. Service implementation

Ví dụ này giả định dự án đã có `AppException` và `ErrorCode`. Hãy ánh xạ
các lỗi trong `GlobalExceptionHandler`.

``` java
package com.example.backend.category.service;

import com.example.backend.category.dto.request.CategoryRequest;
import com.example.backend.category.dto.response.CategoryResponse;
import com.example.backend.category.entity.Category;
import com.example.backend.category.repository.CategoryRepository;
import com.example.backend.common.exception.AppException;
import com.example.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByDeletedFalse()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository
            .findBySlugAndDeletedFalse(slug)
            .orElseThrow(() -> new AppException(
                ErrorCode.CATEGORY_NOT_FOUND
            ));

        return toResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = normalizeSlug(request.slug());

        if (categoryRepository.existsBySlugAndDeletedFalse(slug)) {
            throw new AppException(
                ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS
            );
        }

        Category category = new Category();
        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(request.description());
        category.setIconUrl(request.iconUrl());

        return toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
            .filter(item -> !item.isDeleted())
            .orElseThrow(() -> new AppException(
                ErrorCode.CATEGORY_NOT_FOUND
            ));

        String slug = normalizeSlug(request.slug());

        boolean slugUsedByOther = categoryRepository
            .existsBySlugAndIdNotAndDeletedFalse(slug, id);

        if (slugUsedByOther) {
            throw new AppException(
                ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS
            );
        }

        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(request.description());
        category.setIconUrl(request.iconUrl());

        return toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
            .filter(item -> !item.isDeleted())
            .orElseThrow(() -> new AppException(
                ErrorCode.CATEGORY_NOT_FOUND
            ));

        // TODO: Kiểm tra chính sách xóa khi Product đang tham chiếu.
        category.setDeleted(true);
        categoryRepository.save(category);
    }

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase(Locale.ROOT);
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
            category.getId(),
            category.getName(),
            category.getSlug(),
            category.getDescription(),
            category.getIconUrl(),
            category.getCreatedAt(),
            category.getUpdatedAt()
        );
    }
}
```

**Slug normalization:** hàm trên chỉ trim và chuyển chữ thường. Nó không
tự chuyển `Giường Ngủ` thành `giuong-ngu`. Có thể yêu cầu client gửi
slug chuẩn hoặc tạo slug từ name bằng thư viện phù hợp. Backend vẫn phải
kiểm tra dữ liệu.

**Race condition:** hai request đồng thời có thể cùng thấy slug chưa tồn
tại. Vì vậy cần unique constraint ở database và xử lý lỗi unique
constraint thành `409 Conflict`, không để thành `500`.

### 3.7. Public Controller

``` java
package com.example.backend.category.controller;

import com.example.backend.category.dto.response.CategoryResponse;
import com.example.backend.category.service.CategoryService;
import com.example.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getAllCategories() {
        return ApiResponse.<List<CategoryResponse>>builder()
            .result(categoryService.getAllCategories())
            .build();
    }

    @GetMapping("/{slug}")
    public ApiResponse<CategoryResponse> getCategoryBySlug(
        @PathVariable String slug
    ) {
        return ApiResponse.<CategoryResponse>builder()
            .result(categoryService.getCategoryBySlug(slug))
            .build();
    }
}
```

Đoạn này giả định `ApiResponse` dự án hỗ trợ builder và có trường
`result`. Điều chỉnh theo response contract hiện tại.

### 3.8. Admin Controller

``` java
package com.example.backend.category.controller;

import com.example.backend.category.dto.request.CategoryRequest;
import com.example.backend.category.dto.response.CategoryResponse;
import com.example.backend.category.service.CategoryService;
import com.example.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CategoryResponse> createCategory(
        @Valid @RequestBody CategoryRequest request
    ) {
        return ApiResponse.<CategoryResponse>builder()
            .result(categoryService.createCategory(request))
            .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> updateCategory(
        @PathVariable UUID id,
        @Valid @RequestBody CategoryRequest request
    ) {
        return ApiResponse.<CategoryResponse>builder()
            .result(categoryService.updateCategory(id, request))
            .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategory(id);
    }
}
```

`204 No Content` nghĩa là response không có body. Nếu quy ước API yêu
cầu luôn trả `ApiResponse`, hãy thống nhất lại contract và status code.

------------------------------------------------------------------------

## 4. Security

### 4.1. Authentication và Authorization

-   **Authentication (xác thực):** xác định người gọi là ai, ví dụ
    access token hợp lệ.
-   **Authorization (phân quyền):** xác định người đó được phép làm gì,
    ví dụ chỉ ADMIN mới tạo danh mục.

Access token hợp lệ không tự động có nghĩa người dùng có quyền xóa danh
mục.

### 4.2. Ma trận quyền

  Tình huống                          Kết quả mong đợi
  ----------------------------------- ------------------
  Khách chưa đăng nhập GET danh mục   200
  USER GET danh mục                   200
  Chưa đăng nhập gọi API admin        401
  USER gọi POST/PUT/DELETE admin      403
  ADMIN tạo hợp lệ                    201
  Slug trùng                          409
  DTO không hợp lệ                    400
  Danh mục không tồn tại/đã xóa       404

### 4.3. SecurityConfig mẫu

Ví dụ chỉ minh họa phân quyền endpoint, giả định dự án đã có JWT
authentication filter đưa user vào `SecurityContext`. Không thay thế
toàn bộ cấu hình Security hiện có.

``` java
package com.example.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http
    ) throws Exception {
        http
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/categories",
                    "/api/v1/categories/**"
                ).permitAll()
                .requestMatchers(
                    "/api/v1/admin/categories/**"
                ).hasRole("ADMIN")
                .anyRequest().authenticated()
            );

        // Giữ JWT filter, CORS và các cấu hình khác của dự án.
        return http.build();
    }
}
```

Không nên sao chép đè toàn bộ SecurityConfig đang hoạt động mà chưa hợp
nhất các matcher và filter hiện có.

**CSRF:** Không mặc định disable CSRF trong mọi hệ thống. Nếu xác thực
dựa trên cookie tự động được trình duyệt gửi, đặc biệt refresh token
HttpOnly cookie, cần đánh giá CSRF và cấu hình phù hợp. Với bearer token
được gửi thủ công trong Authorization header, mô hình rủi ro khác nhưng
vẫn phải đánh giá toàn bộ ứng dụng.

### 4.4. `hasRole("ADMIN")` và JWT roles

Spring Security thường chuyển `hasRole("ADMIN")` thành kiểm tra
authority `ROLE_ADMIN`. JWT converter phải chuyển claim roles thành
authority tương ứng. Nếu token chứa `ADMIN` nhưng converter chỉ tạo
authority `ADMIN`, kiểm tra `hasRole("ADMIN")` có thể không khớp.

Ví dụ claim:

``` json
{
  "sub": "admin@example.com",
  "roles": ["USER", "ADMIN"]
}
```

Kiểm tra cấu hình converter hoặc JWT filter để bảo đảm authority được
tạo đúng.

### 4.5. Các biện pháp bảo vệ khác

1.  **DTO allowlist:** không nhận `id`, `isDeleted`, `createdAt`,
    `updatedAt` từ request.
2.  **Validation:** kiểm tra độ dài, trường bắt buộc, format slug, URL.
3.  **Unique constraint:** bảo đảm dữ liệu không trùng kể cả khi request
    đồng thời.
4.  **Soft delete:** không trả danh mục đã xóa qua API public.
5.  **CORS:** chỉ cho phép origin cần thiết; CORS không phải phân quyền
    API.
6.  **Rate limiting:** cân nhắc giới hạn request admin/public nếu có
    nguy cơ lạm dụng.
7.  **Audit log:** ghi nhận ai tạo/sửa/xóa và thời điểm; không log token
    bí mật.
8.  **URL an toàn:** nếu icon URL chỉ được lấy từ CDN, kiểm tra
    allowlist host ở Backend.
9.  **Không lộ lỗi nội bộ:** không trả stack trace, SQL hoặc cấu hình bí
    mật ra client.

### 4.6. ErrorCode và GlobalExceptionHandler

Có thể định nghĩa các lỗi nghiệp vụ:

``` java
public enum ErrorCode {
    CATEGORY_NOT_FOUND,
    CATEGORY_SLUG_ALREADY_EXISTS,
    UNAUTHENTICATED,
    FORBIDDEN
}
```

`AppException` và `GlobalExceptionHandler` cần ánh xạ lỗi sang status
code nhất quán. Ví dụ: - `CATEGORY_NOT_FOUND` → 404. -
`CATEGORY_SLUG_ALREADY_EXISTS` → 409. - Bean Validation lỗi → 400. -
Chưa xác thực → 401. - Thiếu quyền → 403.

Nếu dự án đang dùng mã số trong `ErrorCode`, hãy giữ chuẩn hiện có và
bảo đảm Frontend dùng cùng contract.

------------------------------------------------------------------------

## 5. Database migration và soft delete

Ví dụ PostgreSQL Flyway migration `V1__create_categories.sql`:

``` sql
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categories_slug UNIQUE (slug)
);
```

Migration này không cho tái sử dụng slug đã bị xóa mềm. Đây là chính
sách đơn giản cho MVP.

Nếu dùng PostgreSQL và muốn slug chỉ duy nhất giữa bản ghi đang hoạt
động, có thể dùng partial unique index:

``` sql
CREATE UNIQUE INDEX uk_categories_active_slug
ON categories (slug)
WHERE is_deleted = FALSE;
```

Khi dùng partial index, bỏ unique constraint toàn bảng `UNIQUE(slug)`.
Không giữ cả hai.

Với MySQL, cách thiết kế index khác; không sao chép partial index
PostgreSQL sang MySQL.

### 5.1. Quan hệ với Product

Ví dụ `Product` tham chiếu Category:

``` java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "category_id", nullable = false)
private Category category;
```

Xóa mềm không xóa khóa ngoại. Cần chọn chính sách: - Từ chối xóa nếu còn
sản phẩm. - Chuyển sản phẩm sang danh mục khác trước khi xóa. - Ẩn các
sản phẩm liên quan theo nghiệp vụ.

Đối với MVP, có thể từ chối xóa khi vẫn có sản phẩm liên kết. Hãy kiểm
tra quy tắc này trong Service bằng repository Product tương ứng.

------------------------------------------------------------------------

## 6. Frontend --- React + TypeScript

### 6.1. Cấu trúc thư mục

``` text
src/
├── api/
│   ├── apiClient.ts
│   └── categoryApi.ts
├── types/category.types.ts
├── hooks/useCategories.ts
├── components/category/
│   ├── CategoryCard.tsx
│   ├── CategoryForm.tsx
│   └── CategoryTable.tsx
├── pages/
│   ├── category/
│   │   ├── CategoryListPage.tsx
│   │   └── CategoryDetailPage.tsx
│   └── admin/AdminCategoryPage.tsx
└── routes/
    ├── AppRoutes.tsx
    └── AdminRoute.tsx
```

### 6.2. TypeScript types

`src/types/category.types.ts`:

``` typescript
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
}

export interface ApiResponse<T> {
  code: number | string;
  message?: string;
  result: T;
}
```

**Ánh xạ TypeScript → JavaScript** - `interface` bị loại bỏ khi build. -
`string`, `null`, generic `T` là kiểm tra kiểu lúc phát triển, không tự
validate JSON runtime. - `import type` chỉ import kiểu, không tạo import
runtime. - Dữ liệu từ Backend cần validation runtime nếu muốn bảo đảm
schema, ví dụ dùng Zod.

### 6.3. Axios instance

Nếu dự án đã có Axios instance và interceptor JWT/refresh, hãy tái sử
dụng, không tạo instance riêng cho từng module.

`src/api/apiClient.ts` ví dụ tối giản:

``` typescript
import axios from "axios";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
```

`withCredentials: true` cần khi dùng cookie cross-origin, chẳng hạn
refresh token cookie. Nếu không dùng cookie, cấu hình theo kiến trúc xác
thực thực tế. Với access token trong memory và refresh token HttpOnly
cookie, luồng thường là request interceptor gắn access token; khi 401,
response interceptor gọi refresh; nếu refresh thành công thì retry
request ban đầu; nếu thất bại thì đưa người dùng về luồng đăng nhập. Cần
tránh vòng lặp refresh vô hạn.

### 6.4. API functions

`src/api/categoryApi.ts`:

``` typescript
import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  Category,
  CategoryRequest,
} from "../types/category.types";

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      "/categories"
    );
    return response.data.result;
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(
      `/categories/${encodeURIComponent(slug)}`
    );
    return response.data.result;
  },

  create: async (request: CategoryRequest): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>(
      "/admin/categories",
      request
    );
    return response.data.result;
  },

  update: async (
    id: string,
    request: CategoryRequest
  ): Promise<Category> => {
    const response = await apiClient.put<ApiResponse<Category>>(
      `/admin/categories/${encodeURIComponent(id)}`,
      request
    );
    return response.data.result;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(
      `/admin/categories/${encodeURIComponent(id)}`
    );
  },
};
```

Tại sao tách API layer? Component không phải lặp URL, cấu hình header và
cách đọc response. Khi endpoint thay đổi, sửa tập trung ở một nơi.

**Ánh xạ TypeScript → JavaScript** - `Promise<Category[]>` mô tả kiểu
kết quả, không validate dữ liệu thực. - `async/await` xử lý bất đồng bộ;
lỗi HTTP vẫn cần được xử lý. - `encodeURIComponent` mã hóa giá trị đặt
trong URL. - Generic Axios chỉ giúp kiểm tra kiểu ở compile time.

### 6.5. TanStack Query hooks

Cài đặt:

``` bash
npm install @tanstack/react-query
```

`src/hooks/useCategories.ts`:

``` typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { categoryApi } from "../api/categoryApi";
import type { CategoryRequest } from "../types/category.types";

export const categoryKeys = {
  all: ["categories"] as const,
  detail: (slug: string) => ["categories", slug] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoryApi.getAll,
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => categoryApi.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CategoryRequest) =>
      categoryApi.create(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: CategoryRequest;
    }) => categoryApi.update(id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
    },
  });
}
```

TanStack Query quản lý server state: loading, error, cache, mutation và
refetch. Không nên dùng Zustand chỉ để lưu danh sách Category lấy từ
Backend. Zustand phù hợp hơn với client state như modal, sidebar, theme
hoặc trạng thái UI.

### 6.6. Trang danh sách public

`src/pages/category/CategoryListPage.tsx`:

``` tsx
import { Link } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";

export default function CategoryListPage() {
  const {
    data: categories,
    isLoading,
    isError,
  } = useCategories();

  if (isLoading) {
    return <p>Đang tải danh mục...</p>;
  }

  if (isError) {
    return (
      <p role="alert">
        Không thể tải danh mục. Vui lòng thử lại.
      </p>
    );
  }

  return (
    <main>
      <h1>Danh mục sản phẩm</h1>

      {!categories || categories.length === 0 ? (
        <p>Chưa có danh mục nào.</p>
      ) : (
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="category-card"
            >
              {category.iconUrl && (
                <img src={category.iconUrl} alt="" loading="lazy" />
              )}
              <h2>{category.name}</h2>
              <p>{category.description}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

`key={category.id}` giúp React nhận diện phần tử. `isLoading` và
`isError` đến từ TanStack Query. Kiểu TypeScript không ảnh hưởng runtime
của JSX.

### 6.7. Form tạo/sửa với React Hook Form + Zod

Cài đặt:

``` bash
npm install react-hook-form zod @hookform/resolvers
```

`src/components/category/CategoryForm.tsx`:

``` tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Category,
  CategoryRequest,
} from "../../types/category.types";

const categorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Tên danh mục không được để trống")
    .max(150, "Tên tối đa 150 ký tự"),

  slug: z.string()
    .trim()
    .min(1, "Slug không được để trống")
    .max(180, "Slug tối đa 180 ký tự")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug chỉ gồm chữ thường, số và dấu gạch ngang"
    ),

  description: z.string()
    .max(2000, "Mô tả tối đa 2000 ký tự"),

  iconUrl: z.union([
    z.literal(""),
    z.string().url("URL icon không hợp lệ"),
  ]),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Category;
  isSubmitting: boolean;
  onSubmit: (data: CategoryRequest) => void;
}

export default function CategoryForm({
  initialData,
  isSubmitting,
  onSubmit,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      iconUrl: "",
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      iconUrl: initialData?.iconUrl ?? "",
    });
  }, [initialData, reset]);

  const submitForm = (values: CategoryFormValues) => {
    onSubmit({
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description || null,
      iconUrl: values.iconUrl || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submitForm)}>
      <div>
        <label htmlFor="name">Tên danh mục</label>
        <input id="name" {...register("name")} />
        {errors.name && <p role="alert">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="slug">Slug</label>
        <input id="slug" {...register("slug")} />
        {errors.slug && <p role="alert">{errors.slug.message}</p>}
      </div>

      <div>
        <label htmlFor="description">Mô tả</label>
        <textarea id="description" {...register("description")} />
        {errors.description && (
          <p role="alert">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="iconUrl">URL icon</label>
        <input id="iconUrl" type="url" {...register("iconUrl")} />
        {errors.iconUrl && (
          <p role="alert">{errors.iconUrl.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Đang lưu..."
          : initialData
            ? "Cập nhật danh mục"
            : "Tạo danh mục"}
      </button>
    </form>
  );
}
```

**Ánh xạ TypeScript → JavaScript** - `CategoryFormProps`,
`CategoryFormValues` chỉ tồn tại khi kiểm tra kiểu. - `z.infer` suy luận
kiểu compile time từ schema. - Zod thực sự validate runtime khi form
submit. - `useEffect` đồng bộ dữ liệu ban đầu khi danh mục được chọn
thay đổi. - `initialData?.name ?? ""` dùng optional chaining và nullish
coalescing. - Frontend validation không thay thế validation ở Backend.

### 6.8. Trang Admin --- luồng CRUD

Trang quản trị nên có: - Bảng danh mục và nút thêm. - Form tạo/sửa dùng
chung. - Xác nhận trước khi xóa. - Loading state khi request chạy. -
Thông báo thành công/thất bại. - Xử lý lỗi `400`, `401`, `403`, `404`,
`409`, `500`. - Làm mới cache sau mutation.

Ví dụ luồng xử lý ở component cha:

``` tsx
const createMutation = useCreateCategory();
const updateMutation = useUpdateCategory();
const deleteMutation = useDeleteCategory();

const handleSave = async (
  request: CategoryRequest,
  selectedCategory?: Category
) => {
  if (selectedCategory) {
    await updateMutation.mutateAsync({
      id: selectedCategory.id,
      request,
    });
  } else {
    await createMutation.mutateAsync(request);
  }
};

const handleDelete = async (category: Category) => {
  const confirmed = window.confirm(
    `Bạn có chắc chắn muốn xóa "${category.name}" không?`
  );

  if (!confirmed) return;

  await deleteMutation.mutateAsync(category.id);
};
```

Đây là đoạn minh họa cách gọi mutation; cần đặt trong component có state
và xử lý `try/catch` phù hợp. `window.confirm` và nút disabled chỉ là
UX, không phải bảo mật.

### 6.9. Routing và AdminRoute

Ví dụ route:

``` tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CategoryListPage from "../pages/category/CategoryListPage";
import AdminCategoryPage from "../pages/admin/AdminCategoryPage";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/categories"
          element={<CategoryListPage />}
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminCategoryPage />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

`AdminRoute` cần kiểm tra trạng thái xác thực và role từ AuthContext
hoặc hệ thống auth hiện có. Về logic:

``` tsx
if (isLoading) return <p>Đang kiểm tra đăng nhập...</p>;
if (!isAuthenticated) return <Navigate to="/login" replace />;
if (!user.roles.includes("ADMIN")) return <Navigate to="/" replace />;
return children;
```

Đoạn logic trên cần được đặt trong component có các biến tương ứng và
import `Navigate`. Route guard chỉ bảo vệ giao diện; Backend vẫn phải
chặn API trực tiếp.

------------------------------------------------------------------------

## 7. Flow tổng thể

### 7.1. Tạo Category

``` text
ADMIN nhập form
    ↓
Zod kiểm tra dữ liệu ở Frontend
    ↓
categoryApi.create()
    ↓
Axios gửi POST /api/v1/admin/categories
    ↓
Spring Security xác thực JWT và role ADMIN
    ↓
Controller nhận @Valid CategoryRequest
    ↓
Service chuẩn hóa slug, kiểm tra trùng
    ↓
Repository lưu database
    ↓
Database unique constraint bảo vệ dữ liệu
    ↓
Backend trả 201 + CategoryResponse
    ↓
TanStack Query invalidate cache
    ↓
Danh sách được tải lại
```

### 7.2. Xem Category

``` text
Người dùng mở /categories
    ↓
useCategories()
    ↓
categoryApi.getAll()
    ↓
GET /api/v1/categories
    ↓
Security permitAll
    ↓
Service lấy danh mục chưa xóa
    ↓
Repository truy vấn database
    ↓
Response DTO
    ↓
TanStack Query cache
    ↓
React render danh sách
```

### 7.3. Xóa Category

``` text
ADMIN bấm Xóa
    ↓
Frontend xác nhận
    ↓
DELETE /api/v1/admin/categories/{id}
    ↓
Security kiểm tra ADMIN
    ↓
Service tìm Category đang hoạt động
    ↓
Kiểm tra chính sách Product liên kết
    ↓
Đặt isDeleted = true
    ↓
Repository lưu
    ↓
Trả 204 No Content
    ↓
Invalidate cache danh sách
```

------------------------------------------------------------------------

## 8. Database và URL

### 8.1. Quy tắc soft delete

Soft delete có nghĩa cập nhật cờ `is_deleted`, không xóa vật lý:

``` sql
UPDATE categories
SET is_deleted = TRUE
WHERE id = ?;
```

Mọi truy vấn public cần loại bản ghi đã xóa. Đừng chỉ lọc ở trang danh
mục; API Product, tìm kiếm và bộ lọc cũng cần cùng chính sách.

### 8.2. Slug và SEO

Nếu slug đổi từ `giuong-ngu` sang `giuong-ngu-cao-cap`, URL cũ có thể
không còn hoạt động. Nếu website đã được lập chỉ mục hoặc có link bên
ngoài, cân nhắc bảng redirect/slug history. Với MVP chưa cần SEO phức
tạp, nhưng nên hiểu đây là tác động của việc đổi slug.

------------------------------------------------------------------------

## 9. Kiểm thử

### 9.1. Backend checklist

-   [ ] GET danh sách không cần đăng nhập trả 200.
-   [ ] GET không trả danh mục đã xóa.
-   [ ] GET slug không tồn tại trả 404.
-   [ ] POST chưa đăng nhập bị chặn.
-   [ ] USER không thể POST/PUT/DELETE danh mục.
-   [ ] ADMIN tạo dữ liệu hợp lệ trả 201.
-   [ ] `name` rỗng hoặc `slug` rỗng trả 400.
-   [ ] Slug trùng trả 409, không phải 500.
-   [ ] PUT giữ nguyên slug của chính nó vẫn thành công.
-   [ ] PUT slug trùng danh mục khác trả 409.
-   [ ] DELETE ID không tồn tại trả 404.
-   [ ] DELETE tuân thủ chính sách Product liên kết.
-   [ ] Hai request đồng thời không tạo slug trùng.
-   [ ] Client không thể tự thay đổi `isDeleted` hoặc timestamp.

### 9.2. Frontend checklist

-   [ ] Hiển thị loading.
-   [ ] Hiển thị danh sách khi thành công.
-   [ ] Hiển thị empty state khi không có danh mục.
-   [ ] Hiển thị thông báo lỗi khi API thất bại.
-   [ ] Form chặn tên/slug rỗng.
-   [ ] Form chặn slug sai định dạng.
-   [ ] Tạo thành công và danh sách được làm mới.
-   [ ] Sửa form điền dữ liệu hiện tại.
-   [ ] Lỗi slug trùng hiển thị dễ hiểu.
-   [ ] Xóa có xác nhận.
-   [ ] Route guard chặn USER ở UI.
-   [ ] Backend vẫn chặn USER khi gọi API trực tiếp.

### 9.3. Công cụ

  Công cụ                          Mục đích
  -------------------------------- ------------------------------
  JUnit 5 + Mockito                Unit test Service
  Spring Boot Test + MockMvc       Test HTTP và Security
  Testcontainers                   Test database thực
  Postman                          Kiểm tra API thủ công
  Vitest + React Testing Library   Test React components
  MSW                              Mock API trong test Frontend

------------------------------------------------------------------------

## 10. Thứ tự triển khai đề xuất

1.  **Database và Entity:** bảng, migration, UUID, slug, soft delete.
2.  **Repository + DTO + Service:** CRUD, validation, kiểm tra slug,
    mapping DTO.
3.  **Controller:** hoàn thiện endpoint và response contract.
4.  **Security:** JWT filter, role ADMIN, CORS/CSRF theo kiến trúc thực
    tế.
5.  **Postman:** kiểm thử API public, quyền admin và lỗi nghiệp vụ.
6.  **Frontend types + Axios API layer:** thống nhất kiểu và response.
7.  **TanStack Query:** fetch, cache, mutations, invalidate.
8.  **UI public:** danh sách và chi tiết.
9.  **UI admin:** form, bảng, cập nhật, xóa, thông báo lỗi.
10. **Integration testing:** kiểm tra toàn bộ flow và các trường hợp
    cạnh tranh dữ liệu.

## 11. Các điểm cần chốt trước khi code production

  -----------------------------------------------------------------------
  Vấn đề                              Đề xuất MVP
  ----------------------------------- -----------------------------------
  Slug tái sử dụng sau soft delete?   Không tái sử dụng

  Xóa Category đang có Product?       Từ chối xóa hoặc yêu cầu chuyển
                                      Product trước

  Sinh slug ở đâu?                    Backend chuẩn hóa; Frontend có thể
                                      gợi ý

  Quản lý dữ liệu Backend trên UI?    TanStack Query

  Bảo vệ API admin?                   JWT + role ADMIN ở Backend

  Response khi xóa?                   `204 No Content` nếu không trả body

  Validation?                         Cả Frontend và Backend

  Trùng slug khi request đồng thời?   DB unique constraint + ánh xạ lỗi
                                      thành 409

  Cookie refresh token?               Đánh giá CSRF, CORS và
                                      `withCredentials` đúng kiến trúc

  Database?                           Điều chỉnh UUID, index và migration
                                      theo PostgreSQL/MySQL thực tế
  -----------------------------------------------------------------------

**Ghi nhớ:** Controller nhận request; Service thực thi nghiệp vụ;
Repository truy vấn dữ liệu; DTO giới hạn dữ liệu vào/ra; Security xác
thực và phân quyền; Frontend hỗ trợ UX nhưng không phải ranh giới bảo
mật.
