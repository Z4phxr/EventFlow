package com.eventflow.eventservice.common.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class RabbitMQDomainEventPublisher implements DomainEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    
    private static final String EXCHANGE = "eventflow.exchange";

    @Override
    public void publish(DomainEvent event) {
        try {
            String routingKey = mapToRoutingKey(event.getEventType());
            
            // Create message payload with metadata
            Map<String, Object> message = new HashMap<>();
            message.put("messageId", UUID.randomUUID().toString());
            message.put("eventType", event.getEventType());
            message.put("occurredAt", ZonedDateTime.now().toString());
            message.put("payload", event);
            
            String jsonMessage = objectMapper.writeValueAsString(message);
            
            rabbitTemplate.convertAndSend(EXCHANGE, routingKey, jsonMessage);
            
            log.info("Published event {} with routing key {} to RabbitMQ", 
                    event.getEventType(), routingKey);
            
        } catch (Exception e) {
            log.error("Failed to publish event {} to RabbitMQ", event.getEventType(), e);
            throw new RuntimeException("Failed to publish event to RabbitMQ", e);
        }
    }
    
    private String mapToRoutingKey(String eventType) {
        return switch (eventType) {
            case "EVENT_CREATED" -> "event.created";
            case "EVENT_UPDATED" -> "event.updated";
            case "EVENT_DELETED" -> "event.deleted";
            case "USER_REGISTERED" -> "registration.created";
            case "USER_UNREGISTERED" -> "registration.deleted";
            case "INVITATION_REQUESTED" -> "invitation.requested";
            default -> "event.unknown";
        };
    }
}
