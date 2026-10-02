package com.example.backend;

import com.example.backend.dto.request.CreateProductRequest;
import com.example.backend.dto.request.UpdateProductRequest;
import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductImageRepository;
import com.example.backend.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "app.jwt.secret=test-only-secret-with-at-least-64-utf8-bytes-for-hs512-algorithm",
        "spring.datasource.url=jdbc:h2:mem:product-test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=123456",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.upload.dir=target/test-uploads"
})
class ProductModuleIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private MockMvc mockMvc;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        productImageRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        testCategory = categoryRepository.saveAndFlush(Category.builder()
                .name("Laptop")
                .slug("laptop")
                .description("Thiết bị máy tính xách tay")
                .build());
    }

    @Test
    void publicGetProducts_ReturnsOnlyActiveProductsWithPaginationAndClampsSize() throws Exception {
        // Tạo 1 sản phẩm active và 1 sản phẩm bị soft-deleted
        productRepository.saveAndFlush(Product.builder()
                .name("MacBook Pro 14")
                .slug("macbook-pro-14")
                .category(testCategory)
                .sku("MBP14")
                .price(BigDecimal.valueOf(1999.99))
                .isDeleted(false)
                .build());

        productRepository.saveAndFlush(Product.builder()
                .name("ThinkPad X1 Deleted")
                .slug("thinkpad-x1")
                .category(testCategory)
                .sku("TPX1")
                .price(BigDecimal.valueOf(1499.00))
                .isDeleted(true)
                .build());

        // Kiểm tra request size=500 -> clamp về 100, chỉ trả về sản phẩm chưa xóa
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "500")
                        .param("categorySlug", "laptop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(100))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("MacBook Pro 14"))
                .andExpect(jsonPath("$.data.content[0].slug").value("macbook-pro-14"));
    }

    @Test
    void publicGetProductBySlug_ReturnsDetail() throws Exception {
        productRepository.saveAndFlush(Product.builder()
                .name("Dell XPS 15")
                .slug("dell-xps-15")
                .category(testCategory)
                .sku("DELL-XPS-15")
                .description("<p>Màn hình OLED 4K siêu sắc nét</p>")
                .price(BigDecimal.valueOf(2199.50))
                .isDeleted(false)
                .build());

        mockMvc.perform(get("/api/v1/products/dell-xps-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Dell XPS 15"))
                .andExpect(jsonPath("$.data.sku").value("DELL-XPS-15"))
                .andExpect(jsonPath("$.data.description").value("<p>Màn hình OLED 4K siêu sắc nét</p>"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    void adminCreateProduct_SanitizesHtmlDescriptionAndEnforcesUniqueness() throws Exception {
        String requestJson = String.format("""
                {
                    "name": "Gaming Laptop Asus ROG",
                    "slug": "asus-rog-strix",
                    "categoryId": "%s",
                    "shortDescription": "Laptop gaming cao cấp",
                    "description": "<h3>Thông số</h3><script>alert('xss')</script><p onmouseover='evil()'>Hiệu năng đỉnh cao</p>",
                    "price": 2500.0,
                    "sku": "ROG-STRIX-G16",
                    "inStock": true
                }
                """, testCategory.getId());

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slug").value("asus-rog-strix"))
                .andExpect(jsonPath("$.data.sku").value("ROG-STRIX-G16"))
                // Script và onmouseover phải bị loại bỏ bởi Jsoup Safelist.relaxed()
                .andExpect(jsonPath("$.data.description").value(not(containsString("<script>"))))
                .andExpect(jsonPath("$.data.description").value(not(containsString("onmouseover"))))
                .andExpect(jsonPath("$.data.description").value(containsString("Hiệu năng đỉnh cao")));

        // Tạo lại với cùng slug -> Mong đợi lỗi 409 Conflict (PRODUCT_SLUG_EXISTED)
        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(1030));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    void adminUploadImage_ValidatesMagicBytes_RejectsFakeImage() throws Exception {
        Product product = productRepository.saveAndFlush(Product.builder()
                .name("Test Product")
                .slug("test-prod")
                .category(testCategory)
                .sku("TEST-PROD-SKU")
                .build());

        // File giả mạo: Tên là attack.jpg nhưng nội dung thực tế là text/PHP
        MockMultipartFile fakeImage = new MockMultipartFile(
                "files",
                "attack.jpg",
                "image/jpeg",
                "<?php phpinfo(); ?>".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/admin/products/" + product.getId() + "/images")
                        .file(fakeImage))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1032));

        // File thật: Magic bytes PNG chuẩn (89 50 4E 47 0D 0A 1A 0A)
        byte[] realPngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile validPng = new MockMultipartFile(
                "files",
                "original-name-should-be-ignored.png",
                "image/png",
                realPngBytes
        );

        mockMvc.perform(multipart("/api/v1/admin/products/" + product.getId() + "/images")
                        .file(validPng))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data[0].url").value(startsWith("/uploads/products/")))
                .andExpect(jsonPath("$.data[0].url").value(endsWith(".png")));
    }

    @Test
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    void nonAdminUser_CannotAccessAdminProductEndpoints() throws Exception {
        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    void adminDeleteProduct_PerformsSoftDelete() throws Exception {
        Product product = productRepository.saveAndFlush(Product.builder()
                .name("Product to Delete")
                .slug("prod-to-delete")
                .category(testCategory)
                .sku("PROD-DEL")
                .isDeleted(false)
                .build());

        mockMvc.perform(delete("/api/v1/admin/products/" + product.getId()))
                .andExpect(status().isOk());

        Product reloaded = productRepository.findById(product.getId()).orElseThrow();
        assertTrue(reloaded.getIsDeleted());

        // Kiểm tra query public không còn nhìn thấy sản phẩm này
        mockMvc.perform(get("/api/v1/products/prod-to-delete"))
                .andExpect(status().isNotFound());
    }
}
