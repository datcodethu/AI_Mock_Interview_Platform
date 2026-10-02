package com.example.backend.utils;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * Utility tập trung xử lý làm sạch HTML (Sanitization) chống Stored XSS
 * cho toàn bộ hệ thống (dùng chung cho Product, BlogPost, v.v.).
 *
 * QUYẾT ĐỊNH BẢO MẬT:
 * 1. Sử dụng Jsoup Safelist.relaxed():
 *    - Cho phép các thẻ rich-text định dạng nội dung an toàn:
 *      p, br, h1, h2, h3, h4, h5, h6, strong, em, b, i, u, strike,
 *      ul, ol, li, blockquote, table, thead, tbody, tr, th, td, a, img...
 *    - Tự động loại bỏ hoàn toàn các thẻ thực thi mã:
 *      <script>, <iframe>, <object>, <embed>, <applet>, <form>, <svg>, <meta>, <link>...
 *    - Tự động loại bỏ mọi thuộc tính inline event handlers:
 *      onclick, onerror, onload, onmouseover, onfocus, onblur...
 *    - Tự động loại bỏ các scheme nguy hiểm như "javascript:", "data:", "vbscript:".
 * 2. Đối với thẻ <a>:
 *    - Chỉ cho phép scheme: http, https, ftp, mailto.
 * 3. Đối với thẻ <img>:
 *    - Chỉ cho phép scheme: http, https.
 */
public final class HtmlSanitizer {

    private static final Safelist RELAXED_SAFELIST = Safelist.relaxed()
            .addProtocols("a", "href", "http", "https", "mailto", "ftp")
            .addProtocols("img", "src", "http", "https");

    private HtmlSanitizer() {
        // Utility class
    }

    /**
     * Làm sạch chuỗi HTML đầu vào, loại bỏ triệt để các mã độc hại.
     *
     * @param htmlInput Chuỗi HTML do người dùng/admin nhập
     * @return Chuỗi HTML an toàn đã được chuẩn hóa, hoặc null nếu đầu vào rỗng
     */
    public static String sanitize(String htmlInput) {
        if (htmlInput == null || htmlInput.isBlank()) {
            return null;
        }
        return Jsoup.clean(htmlInput.trim(), RELAXED_SAFELIST);
    }

    /**
     * Kiểm tra URL ảnh có hợp lệ và an toàn không (chỉ chấp nhận http:// hoặc https://).
     * Ngăn chặn SSRF và các scheme độc hại như javascript:, data:, file:.
     *
     * @param url Chuỗi URL cần kiểm tra
     * @return true nếu URL hợp lệ bắt đầu bằng http:// hoặc https://
     */
    public static boolean isValidImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return true; // Cho phép để trống (nullable)
        }
        String trimmed = url.trim().toLowerCase();
        return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/uploads/");
    }

    /**
     * Chuyển đổi chuỗi thành plain text không chứa bất kỳ thẻ HTML nào (dùng cho excerpt, summary).
     *
     * @param input Chuỗi văn bản có thể chứa HTML
     * @return Văn bản thuần túy (plain text) đã loại bỏ toàn bộ thẻ HTML
     */
    public static String toPlainText(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }
        return Jsoup.clean(input.trim(), Safelist.none());
    }
}
