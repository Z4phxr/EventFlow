package com.eventflow.common.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Local implementation of DomainEventPublisher.
 * TODO: Replace with RabbitMQ implementation for grade 5.0
 * This is a placeholder that logs events instead of publishing to a message broker.
 */
@Component
@Slf4j
public class LocalDomainEventPublisher implements DomainEventPublisher {

    @Override
    public void publish(DomainEvent event) {
        log.info("Domain event published (local): {} - {}", event.getEventType(), event.getEventId());
        // TODO: For grade 5.0 - Replace with RabbitMQ publishing
        // Example:
        // rabbitTemplate.convertAndSend(exchangeName, routingKey, event);
    }
}
