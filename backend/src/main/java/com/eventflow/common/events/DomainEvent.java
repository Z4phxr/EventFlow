package com.eventflow.common.events;

import java.util.UUID;

public interface DomainEvent {
    UUID getEventId();
    String getEventType();
}
