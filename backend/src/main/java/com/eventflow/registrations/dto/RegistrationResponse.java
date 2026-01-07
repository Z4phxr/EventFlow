package com.eventflow.registrations.dto;

import com.eventflow.registrations.entity.RegistrationStatus;
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
