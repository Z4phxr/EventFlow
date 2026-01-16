package com.eventflow.userservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // 24 hours default
    private Long expiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            // Try modern API: Jwts.parserBuilder().setSigningKey(...).build().parseClaimsJws(token)
            try {
                java.lang.reflect.Method parserBuilder = Jwts.class.getMethod("parserBuilder");
                Object builder = parserBuilder.invoke(null);
                java.lang.reflect.Method setSigningKey = builder.getClass().getMethod("setSigningKey", Key.class);
                Object builderWithKey = setSigningKey.invoke(builder, getSignKey());
                java.lang.reflect.Method build = builderWithKey.getClass().getMethod("build");
                Object parser = build.invoke(builderWithKey);
                java.lang.reflect.Method parse = parser.getClass().getMethod("parseClaimsJws", String.class);
                Object jws = parse.invoke(parser, token);
                java.lang.reflect.Method getBody = jws.getClass().getMethod("getBody");
                return (Claims) getBody.invoke(jws);
            } catch (NoSuchMethodException e) {
                // Fallback to older API: Jwts.parser().setSigningKey(...).parseClaimsJws(token)
                java.lang.reflect.Method parser = Jwts.class.getMethod("parser");
                Object parserObj = parser.invoke(null);
                java.lang.reflect.Method setSigningKey = parserObj.getClass().getMethod("setSigningKey", Key.class);
                Object parserWithKey = setSigningKey.invoke(parserObj, getSignKey());
                java.lang.reflect.Method parse = parserWithKey.getClass().getMethod("parseClaimsJws", String.class);
                Object jws = parse.invoke(parserWithKey, token);
                java.lang.reflect.Method getBody = jws.getClass().getMethod("getBody");
                return (Claims) getBody.invoke(jws);
            }
        } catch (Exception ex) {
            throw new RuntimeException("Failed to parse JWT", ex);
        }
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public String generateToken(String username, String role, String userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("userId", userId);
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String username) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}


