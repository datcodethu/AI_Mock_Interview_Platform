package com.example.backend.security;


import com.example.backend.entity.User;
import com.example.backend.utils.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getStatus() != UserStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        // Hệ thống không có logic bắt buộc đổi mật khẩu định kỳ
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Chỉ cho phép tài khoản đã ACTIVE đăng nhập.
        // Nếu muốn user PENDING_VERIFY vẫn đăng nhập được nhưng bị hạn chế quyền, đổi thành: return user.getStatus() != UserStatus.LOCKED;
        return user.getStatus() == UserStatus.ACTIVE;
    }
}
