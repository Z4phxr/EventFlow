package com.eventflow.notificationservice.notification;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationSseService {

    private final Map<UUID, SseEmitter> sseEmitters = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(UUID userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        sseEmitters.put(userId, emitter);
        
        emitter.onCompletion(() -> sseEmitters.remove(userId));
        emitter.onTimeout(() -> sseEmitters.remove(userId));
        emitter.onError((e) -> sseEmitters.remove(userId));
        
        try {
            emitter.send(SseEmitter.event()
                .name("connect")
                .data("Connected to notification stream"));
        } catch (Exception e) {
            sseEmitters.remove(userId);
        }
        
        return emitter;
    }
    
    public void notifyUser(UUID userId, Notification notification) {
        SseEmitter emitter = sseEmitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(notification));
            } catch (Exception e) {
                sseEmitters.remove(userId);
            }
        }
    }
    
    public void removeEmitter(UUID userId) {
        sseEmitters.remove(userId);
    }
}