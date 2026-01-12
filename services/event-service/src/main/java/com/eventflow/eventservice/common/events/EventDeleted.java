package com.eventflow.eventservice.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDeleted implements DomainEvent {
    private UUID eventId;
    private String title;
    private UUID organizerId;

    @Override
    public String getEventType() {
        return "EVENT_DELETED";
    }
}
