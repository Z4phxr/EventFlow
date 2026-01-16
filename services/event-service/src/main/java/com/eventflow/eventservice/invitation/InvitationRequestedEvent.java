package com.eventflow.eventservice.invitation;

import com.eventflow.eventservice.common.events.DomainEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvitationRequestedEvent implements DomainEvent {
    private UUID eventId;
    private UUID invitationId;
    private String eventTitle;
    private UUID inviterUserId;
    private String inviterUsername;
    private String inviteeEmail;
    private String token;
    private String eventAddress;
    private String eventCity;
    private String eventStartAt; // ISO string

    @Override
    public String getEventType() {
        return "INVITATION_REQUESTED";
    }
}
