package com.example.backend.config;

import com.example.backend.repository.InvalidTokenRepository;
import com.example.backend.security.CustomJwtAuthenticationConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final CustomJwtAuthenticationConverter customJwtConverter;

        @Autowired
        private InvalidTokenRepository invalidTokenRepository;

        private static final String[] PUBLIC_ENDPOINTS = {
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh-token",
                        "/api/v1/auth/register",
                        "/api/v1/auth/logout",
                        "/api/v1/auth/verify",
                        "/api/v1/auth/resend-verification",
                        "/api/v1/auth/forgot-password",
                        "/api/v1/auth/reset-password",
                        "/api/v1/categories",
                        "/api/v1/categories/**",
                        "/api/v1/products",
                        "/api/v1/products/**",
                        "/api/v1/blog-posts",
                        "/api/v1/blog-posts/**",
                        "/uploads/**",
                        "/api/v1/public/**"
        };

        // hàm khởi tạo để inject CustomJwtAuthenticationConverter vào SecurityConfig
        public SecurityConfig(CustomJwtAuthenticationConverter customJwtConverter) {
                this.customJwtConverter = customJwtConverter;
        }

        // Cấu hình SecurityFilterChain: xác định cách Spring Security xử lý các request
        // HTTP
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
                DefaultBearerTokenResolver defaultBearerTokenResolver = new DefaultBearerTokenResolver(); //
                BearerTokenResolver bearerTokenResolver = request -> {
                        if ("/api/v1/auth/logout".equals(request.getServletPath())) {
                                return null;
                        }
                        return defaultBearerTokenResolver.resolve(request);
                };

                http
                                // 1. Tắt CSRF vì dùng Token (Stateless)
                                .csrf(AbstractHttpConfigurer::disable)

                                // 2. BẬT CORS, dùng đúng bean corsConfigurationSource() khai báo bên dưới.
                                // Thiếu dòng này: trình duyệt tự chặn mọi request cross-origin kèm cookie,
                                // kể cả khi endpoint đã nằm trong PUBLIC_ENDPOINTS — CORS chạy TRƯỚC
                                // authorization, permitAll không "cứu" được request bị chặn ở bước CORS.
                                .cors(cors -> {
                                })

                                // 3. Không lưu Session trên server
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // 4. Phân quyền các endpoint
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/recruiters/**").hasAnyRole("RECRUITER", "ADMIN")
                                                .anyRequest().authenticated())

                                // 5. Cấu hình OAuth2 Resource Server (chấp nhận JWT Bearer Token)
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .bearerTokenResolver(bearerTokenResolver)
                                                .jwt(jwt -> jwt
                                                                .decoder(jwtDecoder)
                                                                .jwtAuthenticationConverter(customJwtConverter)));

                return http.build();
        }

        // Cấu hình CORS: nói cho trình duyệt biết origin nào được phép gọi API này
        // kèm cookie/credentials. KHÔNG được dùng allowedOrigins("*") khi
        // allowCredentials(true)
        // — 2 cái này xung đột nhau, trình duyệt sẽ tự chặn nếu cấu hình sai như vậy.
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of("http://localhost:5173")); // đúng domain FE thật đang chạy
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*")); // cho phép header Authorization, Content-Type...
                config.setAllowCredentials(true); // bắt buộc để trình duyệt gửi/nhận cookie httpOnly

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @Bean
        public JwtDecoder jwtDecoder(@Value("${app.jwt.secret}") String jwtSecret) {
                byte[] jwtSecretBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                if (jwtSecretBytes.length < 64) {
                        throw new IllegalStateException(
                                        "app.jwt.secret must contain at least 64 UTF-8 bytes for HS512.");
                }
                SecretKeySpec secretKeySpec = new SecretKeySpec(jwtSecretBytes, "HmacSHA512");
                NimbusJwtDecoder decoder = NimbusJwtDecoder
                                .withSecretKey(secretKeySpec)
                                .macAlgorithm(MacAlgorithm.HS512)
                                .build();

                OAuth2TokenValidator<Jwt> defaultValidator = JwtValidators.createDefaultWithIssuer("interview.com");
                OAuth2TokenValidator<Jwt> blacklistValidator = jwt -> {
                        String jti = jwt.getId();
                        if (invalidTokenRepository.existsById(jti)) {
                                return OAuth2TokenValidatorResult.failure(
                                                new OAuth2Error("invalid_token", "Token has been revoked", null));
                        }
                        return OAuth2TokenValidatorResult.success();
                };

                decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(defaultValidator, blacklistValidator));
                return decoder;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(10);
        }
}