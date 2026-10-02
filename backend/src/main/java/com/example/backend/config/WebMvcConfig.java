package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Cấu hình Spring MVC phục vụ tài nguyên tĩnh (Static Resources).
 * Cho phép truy cập các file ảnh đã upload an toàn qua URL /uploads/**.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/products}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String resourceLocation = uploadPath.toUri().toString();

        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(resourceLocation.endsWith("/") ? resourceLocation : resourceLocation + "/");
    }
}
