package com.example.backend.config;

import com.example.backend.entity.Role;
import com.example.backend.repository.RoleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Slf4j
@Configuration
public class ApplicationInitConfig { // define role default

    private static final List<String> DEFAULT_ROLES = List.of("USER", "CUSTOMER", "ADMIN", "SUPER_ADMIN");

    @Bean
    ApplicationRunner applicationRunner(
            RoleRepository roleRepository) {
        return args -> {

            DEFAULT_ROLES.forEach(roleName -> {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    roleRepository.save(Role.builder().name(roleName).build());
                    log.info("Đã tạo role: {}", roleName);
                }
            });
        };
    }
}