package com.eventflow.eventservice.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisteredToEvent implements DomainEvent {
    private UUID eventId;
    private UUID userId;
    private UUID organizerId;
    private String eventTitle;

    @Override
    public String getEventType() {
        return "USER_REGISTERED";
    }
}


