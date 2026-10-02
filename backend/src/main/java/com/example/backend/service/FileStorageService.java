package com.example.backend.service;

import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;

/**
 * Service chuyên biệt cho việc lưu trữ file và kiểm tra an toàn tệp tải lên (File Upload Security).
 *
 * CÁC NGUYÊN TẮC BẢO MẬT BẮT BUỘC ĐƯỢC ÁP DỤNG:
 * 1. KIỂM TRA MAGIC BYTES (File Signatures):
 *    - Tuyệt đối KHÔNG tin tưởng HTTP Content-Type header (do client tự gửi trong header multipart,
 *      kẻ tấn công có thể giả mạo dễ dàng bằng Burp Suite/curl).
 *    - Tuyệt đối KHÔNG tin phần mở rộng (extension) ở tên file do client cung cấp (ví dụ webshell.php.jpg).
 *    - Đọc trực tiếp các byte đầu tiên từ InputStream để xác định định dạng nhị phân thực tế của file ảnh.
 *
 * 2. CHỐNG PATH TRAVERSAL (Duyệt thư mục trái phép):
 *    - Tuyệt đối KHÔNG dùng file.getOriginalFilename() để lưu file trực tiếp lên disk.
 *      Kẻ tấn công có thể gửi tên dạng "../../../etc/cron.d/malicious" hoặc "..\\..\\startup\\virus.bat".
 *    - Thay vào đó, toàn bộ tên file được sinh ngẫu nhiên bằng UUID.randomUUID(), đuôi file được suy ra từ
 *      kết quả nhận diện magic bytes thực tế.
 *
 * 3. GIỚI HẠN DUNG LƯỢNG (DoS Protection):
 *    - Giới hạn cứng dung lượng tối đa (mặc định 5MB) trước khi ghi file, ngăn chặn tấn công làm cạn kiệt ổ đĩa.
 */
@Slf4j
@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    // Magic bytes signatures của các định dạng ảnh phổ biến
    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] GIF87A_MAGIC = "GIF87a".getBytes();
    private static final byte[] GIF89A_MAGIC = "GIF89a".getBytes();
    private static final byte[] RIFF_HEADER = "RIFF".getBytes();
    private static final byte[] WEBP_HEADER = "WEBP".getBytes();

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload.dir:uploads/products}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadRoot);
        } catch (IOException e) {
            log.error("Không thể khởi tạo thư mục lưu file upload: {}", this.uploadRoot, e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    /**
     * Xác thực an toàn và lưu trữ file ảnh lên đĩa, trả về đường dẫn URL công khai.
     *
     * @param file file ảnh tải lên từ request multipart
     * @return URL dạng "/uploads/products/{uuid}.{ext}"
     */
    public String storeProductImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // 1. Kiểm tra kích thước file
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("File vượt quá kích thước cho phép: {} bytes (max: {} bytes)", file.getSize(), MAX_FILE_SIZE);
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        // 2. Kiểm tra magic bytes thật sự trong luồng nhị phân
        String extension = detectImageExtensionFromMagicBytes(file);
        if (extension == null) {
            log.warn("Nghi ngờ tấn công: File upload không khớp bất kỳ magic bytes ảnh hợp lệ nào. Tên gốc: {}",
                    file.getOriginalFilename());
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // 3. Sinh tên file ngẫu nhiên bằng UUID (Chống Path Traversal triệt để)
        String safeFileName = UUID.randomUUID().toString() + extension;
        Path targetLocation = this.uploadRoot.resolve(safeFileName).normalize();

        // 4. Đảm bảo file được ghi nằm đúng trong uploadRoot (Defense-in-depth)
        if (!targetLocation.startsWith(this.uploadRoot)) {
            log.error("Cảnh báo bảo mật nghiêm trọng: Phát hiện Path Traversal attempt với tên: {}", safeFileName);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Lưu ảnh sản phẩm thành công: {}", targetLocation);
            return "/uploads/products/" + safeFileName;
        } catch (IOException e) {
            log.error("Lỗi khi ghi file ảnh sản phẩm vào disk: {}", targetLocation, e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    /**
     * Đọc header bytes đầu tiên của file để nhận diện định dạng ảnh thực tế.
     *
     * @param file MultipartFile
     * @return đuôi file hợp lệ (.jpg, .png, .gif, .webp) hoặc null nếu không phải ảnh hợp lệ
     */
    private String detectImageExtensionFromMagicBytes(MultipartFile file) {
        byte[] header = new byte[12];
        try (InputStream is = file.getInputStream()) {
            int bytesRead = is.read(header);
            if (bytesRead < 4) {
                return null;
            }

            // Kiểm tra JPEG (FF D8 FF)
            if (header[0] == JPEG_MAGIC[0] && header[1] == JPEG_MAGIC[1] && header[2] == JPEG_MAGIC[2]) {
                return ".jpg";
            }

            // Kiểm tra PNG (89 50 4E 47 0D 0A 1A 0A)
            if (bytesRead >= 8 && matchesPrefix(header, PNG_MAGIC)) {
                return ".png";
            }

            // Kiểm tra GIF (GIF87a hoặc GIF89a)
            if (bytesRead >= 6 && (matchesPrefix(header, GIF87A_MAGIC) || matchesPrefix(header, GIF89A_MAGIC))) {
                return ".gif";
            }

            // Kiểm tra WebP: 4 bytes đầu là "RIFF", bytes 8..11 là "WEBP"
            if (bytesRead >= 12 && matchesPrefix(header, RIFF_HEADER)) {
                byte[] webpPart = Arrays.copyOfRange(header, 8, 12);
                if (Arrays.equals(webpPart, WEBP_HEADER)) {
                    return ".webp";
                }
            }

            return null;
        } catch (IOException e) {
            log.error("Lỗi khi đọc header file để kiểm tra magic bytes: {}", file.getOriginalFilename(), e);
            return null;
        }
    }

    private static boolean matchesPrefix(byte[] target, byte[] prefix) {
        if (target.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (target[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}
