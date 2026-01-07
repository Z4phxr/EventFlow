package com.eventflow.auth;

import com.eventflow.AbstractIntegrationTest;
import com.eventflow.auth.dto.LoginRequest;
import com.eventflow.auth.dto.RegisterRequest;
import com.eventflow.users.entity.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
public class AuthIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void shouldRegisterNewUser() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password123")
                .role(UserRole.USER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    public void shouldLoginExistingUser() throws Exception {
        // First register
        RegisterRequest registerRequest = RegisterRequest.builder()
                .username("logintest")
                .email("login@example.com")
                .password("password123")
                .role(UserRole.ORGANIZER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        // Then login
        LoginRequest loginRequest = LoginRequest.builder()
                .username("logintest")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("logintest"))
                .andExpect(jsonPath("$.role").value("ORGANIZER"));
    }

    @Test
    public void shouldRejectDuplicateUsername() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .username("duplicate")
                .email("dup1@example.com")
                .password("password123")
                .role(UserRole.USER)
                .build();

        // First registration
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate registration
        RegisterRequest duplicateRequest = RegisterRequest.builder()
                .username("duplicate")
                .email("dup2@example.com")
                .password("password456")
                .role(UserRole.USER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest());
    }
}
