package com.eventflow.notifications.dto;

import com.eventflow.notifications.entity.NotificationType;
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
public class NotificationResponse {
    private UUID id;
    private NotificationType type;
    private String message;
    private UUID eventId;
    private UUID userId;
    private String details;
    private LocalDateTime createdAt;
}
