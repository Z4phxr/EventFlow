package com.eventflow.notifications.service;

import com.eventflow.notifications.dto.NotificationResponse;
import com.eventflow.notifications.entity.Notification;
import com.eventflow.notifications.entity.NotificationType;
import com.eventflow.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void createNotification(NotificationType type, String message, UUID eventId, UUID userId, String details) {
        Notification notification = Notification.builder()
                .type(type)
                .message(message)
                .eventId(eventId)
                .userId(userId)
                .details(details)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyEventCreated(UUID eventId, String eventTitle, UUID organizerId) {
        createNotification(
                NotificationType.EVENT_CREATED,
                "New event created: " + eventTitle,
                eventId,
                organizerId,
                "Event '" + eventTitle + "' has been created"
        );
    }

    @Transactional
    public void notifyEventUpdated(UUID eventId, String eventTitle, UUID organizerId) {
        createNotification(
                NotificationType.EVENT_UPDATED,
                "Event updated: " + eventTitle,
                eventId,
                organizerId,
                "Event '" + eventTitle + "' has been updated"
        );
    }

    @Transactional
    public void notifyEventDeleted(UUID eventId, String eventTitle, UUID organizerId) {
        createNotification(
                NotificationType.EVENT_DELETED,
                "Event deleted: " + eventTitle,
                eventId,
                organizerId,
                "Event '" + eventTitle + "' has been deleted"
        );
    }

    @Transactional
    public void notifyUserRegistered(UUID eventId, UUID userId, String eventTitle) {
        createNotification(
                NotificationType.USER_REGISTERED,
                "User registered for event: " + eventTitle,
                eventId,
                userId,
                "A user has registered for '" + eventTitle + "'"
        );
    }

    @Transactional
    public void notifyUserUnregistered(UUID eventId, UUID userId, String eventTitle) {
        createNotification(
                NotificationType.USER_UNREGISTERED,
                "User unregistered from event: " + eventTitle,
                eventId,
                userId,
                "A user has unregistered from '" + eventTitle + "'"
        );
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .eventId(notification.getEventId())
                .userId(notification.getUserId())
                .details(notification.getDetails())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
