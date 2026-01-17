package com.eventflow.eventservice.common.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Local implementation of DomainEventPublisher.
 * This is a placeholder that logs events instead of publishing to a message broker.
 */
@Component
public class LocalDomainEventPublisher implements DomainEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LocalDomainEventPublisher.class);

    @Override
    public void publish(DomainEvent event) {
        log.info("Domain event published (local): {} - {}", event.getEventType(), event.getEventId());
    }
}


