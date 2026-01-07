package com.eventflow.common.events;

public interface DomainEventPublisher {
    void publish(DomainEvent event);
}
