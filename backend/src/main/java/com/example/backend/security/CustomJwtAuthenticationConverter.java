package com.example.backend.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    // Khai báo hằng số để code gọn gàng và dễ bảo trì hơn
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String ROLES_CLAIM = "roles";

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        // 1. Lấy danh sách roles từ payload của token
        List<String> roles = jwt.getClaimAsStringList(ROLES_CLAIM);

        // 2. Kiểm tra an toàn: Nếu token không có role nào, trả về token với danh sách quyền rỗng
        if (roles == null || roles.isEmpty()) {
            return new JwtAuthenticationToken(jwt, Collections.emptyList());
        }

        // 3. Chuyển String thành GrantedAuthority và tự động gắn thêm chữ "ROLE_"
        Collection<GrantedAuthority> authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role))
                .collect(Collectors.toList());

        // 4. Trả về đối tượng Authentication hợp lệ cho Spring Security
        return new JwtAuthenticationToken(jwt, authorities);
    }
}
