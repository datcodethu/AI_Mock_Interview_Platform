package com.example.backend.config;

import com.example.backend.entity.User;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
public class SpringSecurityAuditorAware  {

//implements AuditorAware<String>
//    @Override
//    public Optional<String> getCurrentAuditor() {
//
//        // lay user hien tai
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//
//        if (authentication == null){
//            return Optional.of("SYSTEM");
//        }
//
//        if (authentication instanceof AnonymousAuthenticationToken){
//            return Optional.of("ANONYMOUS");
//        }
//
//        User user = (User) authentication.getPrincipal();
//        return Optional.of(user.getId());
//
//    }
}
