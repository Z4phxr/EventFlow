package com.eventflow.eventservice.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Configuration for UserDetailsService in JWT-based microservice architecture.
 * Since authentication is handled by JWT tokens from the user-service,
 * this service only needs to exist for Spring Security configuration.
 */
@Configuration
public class UserDetailsServiceConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            // In microservices architecture with JWT, user details come from the token
            // This service is only needed for Spring Security configuration
            throw new UsernameNotFoundException("User details are loaded from JWT token");
        };
    }
}
