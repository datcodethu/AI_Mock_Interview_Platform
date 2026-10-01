package com.example.backend;

import com.example.backend.entity.Category;
import com.example.backend.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.jwt.secret=test-only-secret-with-at-least-64-utf8-bytes-for-hs512-algorithm",
        "spring.datasource.url=jdbc:h2:mem:category-test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=123456",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class CategoryModuleIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        jdbcTemplate.update("DELETE FROM product_entity");
        categoryRepository.deleteAll();
    }

    @Test
    void publicEndpointsReturnOnlyActiveCategoriesAndResolveSlug() throws Exception {
        Category active = categoryRepository.saveAndFlush(Category.builder()
                .name("Bàn ghế")
                .slug("ban-ghe")
                .build());
        categoryRepository.saveAndFlush(Category.builder()
                .name("Đèn")
                .slug("den")
                .isDeleted(true)
                .build());

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].slug").value("ban-ghe"));

        mockMvc.perform(get("/api/v1/categories/{slug}", active.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(active.getId()));

        mockMvc.perform(get("/api/v1/categories/{slug}", "den"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/categories/{slug}", "missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanCreateCategoryAndDuplicateSlugReturnsConflict() throws Exception {
        String request = """
                {"name":"Bàn ghế","slug":"ban-ghe","description":"Nội thất","iconUrl":""}
                """;

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType("application/json")
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slug").value("ban-ghe"))
                .andExpect(jsonPath("$.data.isDeleted").value(false))
                .andExpect(jsonPath("$.data.createdBy").value("user"));

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType("application/json")
                        .content(request))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void invalidCategoryRequestIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType("application/json")
                        .content("""
                                {"name":"  ","slug":"Invalid Slug"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateOfMissingCategoryReturnsNotFound() throws Exception {
        mockMvc.perform(put("/api/v1/admin/categories/{id}", "missing-id")
                        .contentType("application/json")
                        .content("""
                                {"name":"Đồ gỗ","slug":"do-go"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updatePreservesOptionalFieldsWhenTheyAreOmitted() throws Exception {
        Category category = categoryRepository.saveAndFlush(Category.builder()
                .name("Đèn")
                .slug("den")
                .description("Đèn trang trí")
                .iconUrl("https://example.com/lamp.svg")
                .build());

        mockMvc.perform(put("/api/v1/admin/categories/{id}", category.getId())
                        .contentType("application/json")
                        .content("""
                                {"name":"Đèn mới","slug":"den-moi"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.description").value("Đèn trang trí"))
                .andExpect(jsonPath("$.data.iconUrl").value("https://example.com/lamp.svg"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void softDeletePreservesProductsAndRemovesCategoryFromPublicApi() throws Exception {
        Category category = categoryRepository.saveAndFlush(Category.builder()
                .name("Trang trí")
                .slug("trang-tri")
                .build());
        jdbcTemplate.update(
                "INSERT INTO product_entity (id, name, category_id) VALUES (?, ?, ?)",
                "product-1", "Bình hoa", category.getId());

        mockMvc.perform(delete("/api/v1/admin/categories/{id}", category.getId()))
                .andExpect(status().isOk());

        Category deleted = categoryRepository.findById(category.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(deleted.getIsDeleted());
        org.junit.jupiter.api.Assertions.assertEquals(1,
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM product_entity WHERE id = ?",
                        Integer.class,
                        "product-1"));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void adminEndpointsRequireAdminAuthority() throws Exception {
        mockMvc.perform(get("/api/v1/admin/categories"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/categories").with(user("regular-user").roles("USER")))
                .andExpect(status().isForbidden());
    }
}
