package org.example.ai_mock_interview_platform.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private String baseUrl = "http://localhost:8080";

    public void sendVerifyEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("tuandatwj@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Xác thực tài khoản");
        message.setText(
                "Click link để xác thực:\n" +
                        baseUrl + "/api/v1/auth/verify?token=" + token
        );
        mailSender.send(message);
    }
}