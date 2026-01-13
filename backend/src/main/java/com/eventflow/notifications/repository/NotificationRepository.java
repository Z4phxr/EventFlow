package com.eventflow.notifications.repository;

import com.eventflow.notifications.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    List<Notification> findAllByOrderByCreatedAtDesc();
    
    List<Notification> findByEventIdOrderByCreatedAtDesc(UUID eventId);
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
