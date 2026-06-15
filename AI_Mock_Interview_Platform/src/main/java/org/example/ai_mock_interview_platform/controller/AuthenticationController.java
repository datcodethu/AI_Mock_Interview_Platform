package org.example.ai_mock_interview_platform.controller;

import lombok.RequiredArgsConstructor;
import org.example.ai_mock_interview_platform.model.dto.request.AuthenticationRequest;
import org.example.ai_mock_interview_platform.model.dto.request.RefreshTokenRequest;
import org.example.ai_mock_interview_platform.model.dto.response.AuthenticationResponse;
import org.example.ai_mock_interview_platform.model.dto.response.RefreshTokenResponse;
import org.example.ai_mock_interview_platform.model.dto.response.RegisterResponse;
import org.example.ai_mock_interview_platform.service.AuthenticationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    AuthenticationResponse login(@RequestBody AuthenticationRequest request){
        return authenticationService.login(request);
    }

    @PostMapping("/register")
    RegisterResponse register(@RequestBody AuthenticationRequest request){
        return authenticationService.register(request);
    }

    @GetMapping("/verify")
    public String verifyEmail(@RequestParam String token) {
        return authenticationService.verifyEmail(token);
    }

    @PostMapping("/refresh-token")
    public RefreshTokenResponse refreshToken(@RequestBody RefreshTokenRequest request) {
        return authenticationService.refreshToken(request);
    }


}
