package com.example.backend.service;

import com.example.backend.dto.request.IntrospectRequest;
import com.example.backend.dto.response.IntrospectResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.AppException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.InvalidTokenRepository;
import com.example.backend.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class JwtService {

    private final byte[] jwtSecret;

    static final String ISSUER = "interview.com";
    static final String TYPE_ACCESS = "ACCESS";
    static final String TYPE_REFRESH = "REFRESH";

    static final long ACCESS_TOKEN_EXPIRATION = 15 * 60;          // 15 phút
    static final long REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60; // 7 ngày

    private final UserRepository userRepository;
    private final InvalidTokenRepository invalidTokenRepository;

    public JwtService(
            @Value("${app.jwt.secret}") String jwtSecret,
            UserRepository userRepository,
            InvalidTokenRepository invalidTokenRepository) {
        this.jwtSecret = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (this.jwtSecret.length < 64) {
            throw new IllegalStateException("app.jwt.secret must contain at least 64 UTF-8 bytes for HS512.");
        }
        this.userRepository = userRepository;
        this.invalidTokenRepository = invalidTokenRepository;
    }

    // =========================================================
    // ACCESS TOKEN
    // =========================================================

    public String generateToken(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("Generate token failed - user not found: {}", email);
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        List<String> roleNames = user.getRoles()
                .stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        Instant now = Instant.now();

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(email)
                .issuer(ISSUER)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(ACCESS_TOKEN_EXPIRATION, ChronoUnit.SECONDS)))
                .jwtID(UUID.randomUUID().toString())
                .claim("type", TYPE_ACCESS)
                .claim("roles", roleNames)
                .claim("fullName", user.getUserName())
                .build();

        String token = signToken(claims);
        log.debug("Access token generated for: {}", email);
        return token;
    }

    // =========================================================
    // REFRESH TOKEN
    // =========================================================

    public String generateRefreshToken(String email) {
        Instant now = Instant.now();

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(email)
                .issuer(ISSUER)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(REFRESH_TOKEN_EXPIRATION, ChronoUnit.SECONDS)))
                .jwtID(UUID.randomUUID().toString())
                .claim("type", TYPE_REFRESH)
                .build();

        String token = signToken(claims);
        log.debug("Refresh token generated for: {}", email);
        return token;
    }

    // =========================================================
    // SIGN JWT
    // =========================================================

    private String signToken(JWTClaimsSet claims) {
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
            Payload payload = new Payload(claims.toJSONObject());
            JWSObject jwsObject = new JWSObject(header, payload);
            jwsObject.sign(new MACSigner(jwtSecret));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            // Lỗi này gần như không bao giờ xảy ra trong thực tế (chỉ khi cấu hình sai thuật toán/key),
            // nên log ERROR kèm stacktrace để dev biết ngay có vấn đề nghiêm trọng ở tầng ký token
            log.error("Failed to sign JWT", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // =========================================================
    // VERIFY ACCESS TOKEN
    // =========================================================

    public SignedJWT verifyAccessToken(String token) throws ParseException, JOSEException {
        SignedJWT jwt = verifySignatureAndExpiration(token);

        String type = jwt.getJWTClaimsSet().getStringClaim("type");
        if (!TYPE_ACCESS.equals(type)) {
            log.warn("Token type mismatch - expected ACCESS but got: {}", type);
            throw new AppException(ErrorCode.TOKEN_TYPE_MISMATCH);
        }

        return jwt;
    }

    // =========================================================
    // VERIFY REFRESH TOKEN
    // =========================================================

    public SignedJWT verifyRefreshToken(String token) throws ParseException, JOSEException {
        SignedJWT jwt = verifySignatureAndExpiration(token);

        String type = jwt.getJWTClaimsSet().getStringClaim("type");
        if (!TYPE_REFRESH.equals(type)) {
            log.warn("Token type mismatch - expected REFRESH but got: {}", type);
            throw new AppException(ErrorCode.TOKEN_TYPE_MISMATCH);
        }

        return jwt;
    }

    // =========================================================
    // COMMON VERIFY
    // =========================================================

    private SignedJWT verifySignatureAndExpiration(String token) throws ParseException, JOSEException {

        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(jwtSecret);

        boolean verified = signedJWT.verify(verifier);
        if (!verified) {
            log.warn("Token verification failed - invalid signature");
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
        Date expirationTime = claims.getExpirationTime();

        if (expirationTime == null || expirationTime.before(new Date())) {
            log.info("Token expired - subject: {}, jti: {}", claims.getSubject(), claims.getJWTID());
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        if (!ISSUER.equals(claims.getIssuer())) {
            log.warn("Token rejected - unexpected issuer: {}", claims.getIssuer());
            throw new AppException(ErrorCode.TOKEN_INVALID_ISSUER);
        }

        if (invalidTokenRepository.existsById(claims.getJWTID())) {
            log.info("Token rejected - already revoked, jti: {}", claims.getJWTID());
            throw new AppException(ErrorCode.TOKEN_REVOKED);
        }

        return signedJWT;
    }

    // =========================================================
    // INTROSPECT
    // =========================================================

    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            verifyAccessToken(request.getToken());
            return IntrospectResponse.builder().valid(true).build();
        } catch (Exception e) {
            // Introspect là API "kiểm tra token còn dùng được không" — mọi lý do fail
            // (hết hạn, sai chữ ký, bị revoke...) đều chỉ cần trả valid=false,
            // không cần lộ chi tiết lý do ra ngoài. Log ở mức DEBUG để vẫn trace được khi cần.
            log.debug("Introspect - token invalid: {}", e.getMessage());
            return IntrospectResponse.builder().valid(false).build();
        }
    }
}