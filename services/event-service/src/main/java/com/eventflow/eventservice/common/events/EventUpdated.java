package com.eventflow.eventservice.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventUpdated implements DomainEvent {
    private UUID eventId;
    private String title;

    @Override
    public String getEventType() {
        return "EVENT_UPDATED";
    }
}


