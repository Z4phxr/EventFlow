package com.eventflow.notificationservice.notification;

import com.eventflow.notificationservice.mail.EmailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final NotificationSseService notificationSseService;

    @RabbitListener(queues = "notification.queue")
    public void handleDomainEvent(String message) {
        try {
            log.info("Received message from RabbitMQ: {}", message);
            
            JsonNode rootNode = objectMapper.readTree(message);
            String messageId = rootNode.get("messageId").asText();
            String eventType = rootNode.get("eventType").asText();
            JsonNode payload = rootNode.get("payload");
            
            if (notificationRepository.existsByExternalMessageId(messageId)) {
                log.info("Message {} already processed, skipping", messageId);
                return;
            }
            
            if ("INVITATION_REQUESTED".equals(eventType)) {
                handleInvitationRequested(payload);
                return;
            }
            
            if (payload.has("recipients")) {
                handleMultiRecipientEvent(messageId, eventType, payload);
                return;
            }
            
            if (("USER_REGISTERED".equals(eventType) || "USER_UNREGISTERED".equals(eventType)) 
                && payload.has("organizerId")) {
                handleRegistrationEvent(messageId, eventType, payload);
                return;
            }
            
            Notification notification = buildNotification(messageId, eventType, payload);
            
            if (notification != null) {
                try {
                    Notification savedNotification = notificationRepository.save(notification);
                    log.info("Saved notification for event type: {}", eventType);
                    
                    if (savedNotification.getUserId() != null) {
                        notificationSseService.notifyUser(savedNotification.getUserId(), savedNotification);
                    }
                } catch (DataIntegrityViolationException e) {
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
                        .message(String.format("Your event '%s' has been created successfully", title))
                        .read(false)
                        .build();
            }
            
            case "USER_REGISTERED" -> {
                UUID userId = UUID.fromString(payload.get("userId").asText());
                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                UUID organizerId = payload.has("organizerId") ? 
                    UUID.fromString(payload.get("organizerId").asText()) : null;
                String eventTitle = payload.has("eventTitle") ? 
                    payload.get("eventTitle").asText() : "an event";
                
                yield Notification.builder()
                        .externalMessageId(messageId)
                        .userId(userId)
                        .eventId(eventId)
                        .type("REGISTRATION_CONFIRMED")
                        .message(String.format("You have successfully registered for '%s'", eventTitle))
                        .read(false)
                        .build();
            }
            
            case "USER_UNREGISTERED" -> {
                UUID userId = UUID.fromString(payload.get("userId").asText());
                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                String eventTitle = payload.has("eventTitle") ? 
                    payload.get("eventTitle").asText() : "an event";
                
                yield Notification.builder()
                        .externalMessageId(messageId)
                        .userId(userId)
                        .eventId(eventId)
                        .type("REGISTRATION_CANCELLED")
                        .message(String.format("You have been unregistered from '%s'", eventTitle))
                        .read(false)
                        .build();
            }
            
            default -> {
                log.warn("Unknown event type: {}", eventType);
                yield null;
            }
        };
    }
    
    private void handleMultiRecipientEvent(String messageId, String eventType, JsonNode payload) {
        try {
            UUID eventId = UUID.fromString(payload.get("eventId").asText());
            String title = payload.get("title").asText();
            UUID organizerId = payload.has("organizerId") ? 
                UUID.fromString(payload.get("organizerId").asText()) : null;
            
            JsonNode recipientsNode = payload.get("recipients");
            
            if (recipientsNode == null || !recipientsNode.isArray()) {
                log.warn("Recipients field is missing or not an array for event type: {}", eventType);
                return;
            }
            
            List<UUID> recipients = new ArrayList<>();
            for (JsonNode recipientNode : recipientsNode) {
                recipients.add(UUID.fromString(recipientNode.asText()));
            }
            
            if (organizerId != null && !recipients.contains(organizerId)) {
                recipients.add(organizerId);
            }
            
            String messageTemplate = switch (eventType) {
                case "EVENT_UPDATED" -> "Event '%s' has been updated";
                case "EVENT_DELETED" -> "Event '%s' has been cancelled";
                default -> "Event '%s' notification";
            };
            
            for (UUID recipientId : recipients) {
                String uniqueMessageId = messageId + "-" + recipientId;
                
                if (notificationRepository.existsByExternalMessageId(uniqueMessageId)) {
                    log.debug("Notification already exists for recipient {} with messageId {}", 
                        recipientId, uniqueMessageId);
                    continue;
                }
                
                Notification notification = Notification.builder()
                        .externalMessageId(uniqueMessageId)
                        .userId(recipientId)
                        .eventId(eventId)
                        .type(eventType)
                        .message(String.format(messageTemplate, title))
                        .read(false)
                        .build();
                
                try {
                    Notification savedNotification = notificationRepository.save(notification);
                    log.info("Saved notification for user {} for event type: {}", recipientId, eventType);
                    
                    notificationSseService.notifyUser(recipientId, savedNotification);
                } catch (DataIntegrityViolationException e) {
                    log.warn("Duplicate notification for recipient {} with messageId {}", 
                        recipientId, uniqueMessageId);
                }
            }
            
            log.info("Created {} notifications for event type: {}", recipients.size(), eventType);
            
        } catch (Exception e) {
            log.error("Failed to handle multi-recipient event", e);
            throw new RuntimeException("Failed to handle multi-recipient event", e);
        }
    }
    
    private void handleRegistrationEvent(String messageId, String eventType, JsonNode payload) {
        try {
            UUID userId = UUID.fromString(payload.get("userId").asText());
            UUID eventId = UUID.fromString(payload.get("eventId").asText());
            UUID organizerId = UUID.fromString(payload.get("organizerId").asText());
            String eventTitle = payload.has("eventTitle") ? 
                payload.get("eventTitle").asText() : "an event";
            
            boolean isRegistration = "USER_REGISTERED".equals(eventType);
            
            String userMessageId = messageId + "-user";
            if (!notificationRepository.existsByExternalMessageId(userMessageId)) {
                Notification userNotification = Notification.builder()
                        .externalMessageId(userMessageId)
                        .userId(userId)
                        .eventId(eventId)
                        .type(isRegistration ? "REGISTRATION_CONFIRMED" : "REGISTRATION_CANCELLED")
                        .message(isRegistration ? 
                            String.format("You have successfully registered for '%s'", eventTitle) :
                            String.format("You have been unregistered from '%s'", eventTitle))
                        .read(false)
                        .build();
                
                try {
                    Notification savedUserNotification = notificationRepository.save(userNotification);
                    log.info("Saved notification for user {} for event type: {}", userId, eventType);
                    
                    notificationSseService.notifyUser(userId, savedUserNotification);
                } catch (DataIntegrityViolationException e) {
                    log.warn("Duplicate notification for user {} with messageId {}", userId, userMessageId);
                }
            }
            
            String organizerMessageId = messageId + "-organizer";
            if (!notificationRepository.existsByExternalMessageId(organizerMessageId)) {
                Notification organizerNotification = Notification.builder()
                        .externalMessageId(organizerMessageId)
                        .userId(organizerId)
                        .eventId(eventId)
                        .type(isRegistration ? "USER_REGISTERED" : "USER_UNREGISTERED")
                        .message(isRegistration ? 
                            String.format("A new user registered for your event '%s'", eventTitle) :
                            String.format("A user unregistered from your event '%s'", eventTitle))
                        .read(false)
                        .build();
                
                try {
                    Notification savedOrganizerNotification = notificationRepository.save(organizerNotification);
                    log.info("Saved notification for organizer {} for event type: {}", organizerId, eventType);
                    
                    notificationSseService.notifyUser(organizerId, savedOrganizerNotification);
                } catch (DataIntegrityViolationException e) {
                    log.warn("Duplicate notification for organizer {} with messageId {}", 
                        organizerId, organizerMessageId);
                }
            }
            
            log.info("Created 2 notifications (user + organizer) for event type: {}", eventType);
            
        } catch (Exception e) {
            log.error("Failed to handle registration event", e);
            throw new RuntimeException("Failed to handle registration event", e);
        }
    }
    
    private void handleInvitationRequested(JsonNode payload) {
        try {
            String inviteeEmail = payload.get("inviteeEmail").asText();
            String inviterUsername = payload.get("inviterUsername").asText();
            String eventTitle = payload.get("eventTitle").asText();
            String eventStartAt = payload.get("eventStartAt").asText();
            String eventAddress = payload.get("eventAddress").asText();
            String eventCity = payload.get("eventCity").asText();
            String token = payload.get("token").asText();
            
            emailService.sendInvitationEmail(
                    inviteeEmail,
                    inviterUsername,
                    eventTitle,
                    eventStartAt,
                    eventAddress,
                    eventCity,
                    token
            );
            
            log.info("Sent invitation email to {} for event {}", inviteeEmail, eventTitle);
        } catch (Exception e) {
            log.error("Failed to send invitation email", e);
        }
    }
}
