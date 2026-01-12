package com.eventflow.notificationservice.notification;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications", 
       indexes = @Index(name = "idx_external_message_id", columnList = "externalMessageId", unique = true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = true)
    private UUID userId; // Nullable for broadcast notifications

    @Column(nullable = true)
    private UUID eventId; // Nullable if not event-related

    @Column(nullable = false, length = 50)
    private String type; // EVENT_CREATED, EVENT_UPDATED, REGISTRATION_CONFIRMED, etc.

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private Boolean read = false;

    @Column(nullable = false, unique = true)
    private String externalMessageId; // For idempotency

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
