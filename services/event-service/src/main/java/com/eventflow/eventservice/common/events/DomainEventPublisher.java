package com.eventflow.eventservice.common.events;

public interface DomainEventPublisher {
    void publish(DomainEvent event);
}


