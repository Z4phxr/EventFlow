package com.eventflow.userservice.auth;

import com.eventflow.userservice.dto.AuthResponse;
import com.eventflow.userservice.dto.LoginRequest;
import com.eventflow.userservice.dto.RegisterRequest;
import com.eventflow.userservice.common.exception.BusinessException;
import com.eventflow.userservice.security.JwtTokenProvider;
import com.eventflow.userservice.user.User;
import com.eventflow.userservice.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings({"NullableProblems", "DataFlowIssue"})
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .encryptedEmail(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .build();

        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name(), user.getId().toString(), user.getEncryptedEmail());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEncryptedEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("User not found"));

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name(), user.getId().toString(), user.getEncryptedEmail());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEncryptedEmail())
                .role(user.getRole().name())
                .build();
    }
    
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        return userRepository.existsByEncryptedEmail(email);
    }
}


