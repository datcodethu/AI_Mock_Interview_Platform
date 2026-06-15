package org.example.ai_mock_interview_platform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/test") // Định nghĩa đường dẫn base ở đây
public class test { // Đổi tên class viết hoa chữ cái đầu

    @GetMapping
    public String get() {
        return "index";
    }
}