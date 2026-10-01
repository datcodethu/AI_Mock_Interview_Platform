package com.example.backend.service;

import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public void sendVerifyEmail(String email, String token){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("tuandatwj@gmail.com");
        message.setTo(email);
        message.setSubject("Verify Email");
        String url = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/register/verify")
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();
        message.setText("Click link để xác thực:\n" +
                url);
        mailSender.send(message);
    }

    public void sendResetPasswordEmail(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("tuandatwj@gmail.com");
        message.setTo(email);
        message.setSubject("Yêu cầu đặt lại mật khẩu");

        String resetLink = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/reset-password")
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();

        message.setText(
                "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n" +
                        "Nhấn vào link sau để đặt mật khẩu mới (link có hiệu lực trong 30 phút):\n" +
                        resetLink + "\n\n" +
                        "Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này " +
                        "— mật khẩu của bạn sẽ không bị thay đổi."
        );

        mailSender.send(message);
    }
}
