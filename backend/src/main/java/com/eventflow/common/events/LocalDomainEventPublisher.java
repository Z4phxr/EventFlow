package com.eventflow.common.events;

import com.eventflow.notifications.entity.NotificationType;
import com.eventflow.notifications.repository.NotificationRepository;
import com.eventflow.notifications.entity.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Local implementation of DomainEventPublisher.
 * TODO: Replace with RabbitMQ implementation for grade 5.0
 * This is a placeholder that logs events and creates notifications locally.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class LocalDomainEventPublisher implements DomainEventPublisher {

    private final NotificationRepository notificationRepository;

    @Override
    public void publish(DomainEvent event) {
        log.info("Domain event published (local): {} - {}", event.getEventType(), event.getEventId());
        
        // Create notification based on event type
        createNotificationFromEvent(event);
    }

    private void createNotificationFromEvent(DomainEvent event) {
        try {
            NotificationType type = mapEventType(event.getEventType());
            if (type == null) return;

            Notification notification = Notification.builder()
                    .type(type)
                    .message(buildMessage(event))
                    .eventId(event.getEventId())
                    .userId(extractUserId(event))
                    .details(buildDetails(event))
                    .build();
            
            notificationRepository.save(notification);
            log.debug("Notification created for event: {}", event.getEventType());
        } catch (Exception e) {
            log.warn("Failed to create notification for event {}: {}", event.getEventType(), e.getMessage());
        }
    }

    private NotificationType mapEventType(String eventType) {
        return switch (eventType) {
            case "EVENT_CREATED" -> NotificationType.EVENT_CREATED;
            case "EVENT_UPDATED" -> NotificationType.EVENT_UPDATED;
            case "EVENT_DELETED" -> NotificationType.EVENT_DELETED;
            case "USER_REGISTERED" -> NotificationType.USER_REGISTERED;
            case "USER_UNREGISTERED" -> NotificationType.USER_UNREGISTERED;
            default -> null;
        };
    }

    private String buildMessage(DomainEvent event) {
        return switch (event.getEventType()) {
            case "EVENT_CREATED" -> "New event created: " + getEventTitle(event);
            case "EVENT_UPDATED" -> "Event updated: " + getEventTitle(event);
            case "EVENT_DELETED" -> "Event deleted";
            case "USER_REGISTERED" -> "User registered for event";
            case "USER_UNREGISTERED" -> "User unregistered from event";
            default -> "Event: " + event.getEventType();
        };
    }

    private String buildDetails(DomainEvent event) {
        if (event instanceof EventCreated ec) {
            return "Event '" + ec.getTitle() + "' has been created";
        } else if (event instanceof EventUpdated eu) {
            return "Event '" + eu.getTitle() + "' has been updated";
        } else if (event instanceof UserRegisteredToEvent) {
            return "A user has registered for this event";
        } else if (event instanceof UserUnregisteredFromEvent) {
            return "A user has unregistered from this event";
        }
        return event.getEventType();
    }

    private String getEventTitle(DomainEvent event) {
        if (event instanceof EventCreated ec) {
            return ec.getTitle();
        } else if (event instanceof EventUpdated eu) {
            return eu.getTitle();
        }
        return "Unknown";
    }

    private java.util.UUID extractUserId(DomainEvent event) {
        if (event instanceof EventCreated ec) {
            return ec.getOrganizerId();
        } else if (event instanceof UserRegisteredToEvent ur) {
            return ur.getUserId();
        } else if (event instanceof UserUnregisteredFromEvent uu) {
            return uu.getUserId();
        }
        return null;
    }
}
