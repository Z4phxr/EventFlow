package com.eventflow.notificationservice.notification;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification endpoints")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationSseService notificationSseService;

    @GetMapping
    @Operation(summary = "Get notifications for current user with pagination")
    public ResponseEntity<Page<Notification>> getNotifications(
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        UUID userId = UUID.fromString(userIdHeader);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count for current user")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("X-User-Id") String userIdHeader
    ) {
        UUID userId = UUID.fromString(userIdHeader);
        long count = notificationRepository.countByUserIdAndReadFalse(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    @Transactional
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userIdHeader
    ) {
        UUID userId = UUID.fromString(userIdHeader);
        return notificationRepository.findByIdAndUserId(id, userId)
                .map(notification -> {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for current user")
    @Transactional
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
            @RequestHeader("X-User-Id") String userIdHeader
    ) {
        UUID userId = UUID.fromString(userIdHeader);
        int updated = notificationRepository.markAllAsReadByUserId(userId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }
    
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream real-time notifications for current user")
    public SseEmitter streamNotifications(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(value = "userId", required = false) String userIdParam
    ) {
        String userIdStr = userIdHeader != null ? userIdHeader : userIdParam;
        if (userIdStr == null || userIdStr.isEmpty()) {
            throw new IllegalArgumentException("User ID is required either in header or query parameter");
        }
        UUID userId = UUID.fromString(userIdStr);
        return notificationSseService.createEmitter(userId);
    }
}
