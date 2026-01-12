package com.eventflow.notificationservice.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "notification.queue")
    public void handleDomainEvent(String message) {
        try {
            log.info("Received message from RabbitMQ: {}", message);
            
            JsonNode rootNode = objectMapper.readTree(message);
            String messageId = rootNode.get("messageId").asText();
            String eventType = rootNode.get("eventType").asText();
            JsonNode payload = rootNode.get("payload");
            
            // Check if we already processed this message (idempotency)
            if (notificationRepository.existsByExternalMessageId(messageId)) {
                log.info("Message {} already processed, skipping", messageId);
                return;
            }
            
            Notification notification = buildNotification(messageId, eventType, payload);
            
            if (notification != null) {
                try {
                    notificationRepository.save(notification);
                    log.info("Saved notification for event type: {}", eventType);
                } catch (DataIntegrityViolationException e) {
                    // Another instance might have saved it concurrently
                    log.warn("Duplicate notification detected for messageId: {}", messageId);
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process RabbitMQ message", e);
            throw new RuntimeException("Failed to process message", e);
        }
    }
    
    private Notification buildNotification(String messageId, String eventType, JsonNode payload) {
        return switch (eventType) {
            case "EVENT_CREATED" -> {
                UUID organizerId = UUID.fromString(payload.get("organizerId").asText());
                String title = payload.get("title").asText();
                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                
                yield Notification.builder()
                        .externalMessageId(messageId)
                        .userId(organizerId)
                        .eventId(eventId)
                        .type("EVENT_CREATED")
                        .message(String.format("Your event '%s' has been created successfully!", title))
                        .read(false)
                        .build();
            }
            
            case "EVENT_UPDATED" -> {
                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                String title = payload.get("title").asText();
                
                // Broadcast notification (userId = null)
                yield Notification.builder()
                        .externalMessageId(messageId)
                        .userId(null)
                        .eventId(eventId)
                        .type("EVENT_UPDATED")
                        .message(String.format("Event '%s' has been updated", title))
                        .read(false)
                        .build();
            }
            
            case "EVENT_DELETED" -> {
                UUID organizerId = UUID.fromString(payload.get("organizerId").asText());
                String title = payload.get("title").asText();
                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                
                yield Notification.builder()
                        .externalMessageId(messageId)
                        .userId(organizerId)
                        .eventId(eventId)
                        .type("EVENT_DELETED")
                        .message(String.format("Your event '%s' has been deleted", title))
                        .read(false)
                        .build();
            }
            
            case "USER_REGISTERED" -> {
                UUID userId = UUID.fromString(payload.get("userId").asText());
                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                
                yield Notification.builder()
                        .externalMessageId(messageId)
                        .userId(userId)
                        .eventId(eventId)
                        .type("REGISTRATION_CONFIRMED")
                        .message("You have successfully registered to an event")
                        .read(false)
                        .build();
            }
            
            case "USER_UNREGISTERED" -> {
                UUID userId = UUID.fromString(payload.get("userId").asText());
                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                
                yield Notification.builder()
                        .externalMessageId(messageId)
                        .userId(userId)
                        .eventId(eventId)
                        .type("REGISTRATION_CANCELLED")
                        .message("You have been unregistered from an event")
                        .read(false)
                        .build();
            }
            
            default -> {
                log.warn("Unknown event type: {}", eventType);
                yield null;
            }
        };
    }
}
