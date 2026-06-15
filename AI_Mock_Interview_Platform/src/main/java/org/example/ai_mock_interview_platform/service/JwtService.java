package org.example.ai_mock_interview_platform.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.Getter;
import lombok.Setter;
import org.example.ai_mock_interview_platform.model.entity.User;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.Date;
@Getter
@Setter
@Service
public class JwtService {

    private final String secretKey = "+m5+Tf5j1WFFSXQ+kGE0g6rrmjoPtUJtLZjXMpVZFNkPgTiPlvl3lOnEjq+pnL3f";
    private final Long accessTokenExpiration = 30L;
    private final Long refreshTokenExpiration = 60L;

    public String generateAccessToken(User user){
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        Date issueTime = new Date();
        Date expirationTime = Date.from(issueTime.toInstant().plus(accessTokenExpiration, ChronoUnit.MINUTES));
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issueTime(issueTime)
                .expirationTime(expirationTime)
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(secretKey));
        }catch (JOSEException e){
            throw new RuntimeException(e);
        }

        return jwsObject.serialize();
    }


    public String generateRefreshToken(User user){
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        Date issueTime = new Date();
        Date expirationTime = Date.from(issueTime.toInstant().plus(refreshTokenExpiration, ChronoUnit.DAYS));
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issueTime(issueTime)
                .expirationTime(expirationTime)
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(secretKey));
        }catch (JOSEException e){
            throw new RuntimeException(e);
        }

        return jwsObject.serialize();
    }

}
