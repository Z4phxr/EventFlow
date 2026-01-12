package com.eventflow.eventservice.registration;

import com.eventflow.eventservice.registration.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationResponse {
    
    private UUID id;
    private UUID eventId;
    private UUID userId;
    private RegistrationStatus status;
    private LocalDateTime createdAt;
}


