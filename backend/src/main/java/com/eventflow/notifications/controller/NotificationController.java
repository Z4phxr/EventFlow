package com.eventflow.notifications.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @GetMapping
    public ResponseEntity<List<?>> getAllNotifications() {
        // Return empty list for now - notification service not implemented in monolith
        return ResponseEntity.ok(List.of());
    }
}
