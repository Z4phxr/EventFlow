package com.eventflow.eventservice.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventUpdated implements DomainEvent {
    private UUID eventId;
    private String title;
    private UUID organizerId;
    private List<UUID> recipients;

    @Override
    public String getEventType() {
        return "EVENT_UPDATED";
    }
}


