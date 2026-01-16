package com.eventflow.eventservice.invitation;

import com.eventflow.eventservice.event.Event;
import com.eventflow.eventservice.event.EventRepository;
import com.eventflow.eventservice.invitation.dto.InvitationCreateRequest;
import com.eventflow.eventservice.invitation.dto.InvitationResponse;
import com.eventflow.eventservice.common.events.DomainEventPublisher;
import com.eventflow.eventservice.security.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final EventRepository eventRepository;
    private final DomainEventPublisher eventPublisher;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public InvitationResponse createInvitation(UUID eventId, InvitationCreateRequest request, User currentUser) {
        // Validate event exists
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        // Check authorization: must be event owner or ADMIN
        if (!event.getOrganizerId().equals(currentUser.getId()) && 
            !currentUser.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Not authorized to invite users to this event");
        }

        // Check for duplicate pending invitation
        if (invitationRepository.existsByEventIdAndInviteeEmailAndStatus(
                eventId, request.getEmail().toLowerCase(), InvitationStatus.PENDING)) {
            throw new IllegalArgumentException("A pending invitation already exists for this email");
        }

        // Generate secure token
        String token = generateSecureToken();

        // Create invitation
        Invitation invitation = Invitation.builder()
                .eventId(eventId)
                .inviterUserId(currentUser.getId())
                .inviteeEmail(request.getEmail().toLowerCase())
                .token(token)
                .status(InvitationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();

        invitation = invitationRepository.save(invitation);
        log.info("Created invitation {} for event {} to email {}", 
                invitation.getId(), eventId, request.getEmail());

        // Publish RabbitMQ event
        publishInvitationRequestedEvent(invitation, event, currentUser);

        return mapToResponse(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getEventInvitations(UUID eventId, User currentUser) {
        // Validate event exists
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        // Check authorization
        if (!event.getOrganizerId().equals(currentUser.getId()) && 
            !currentUser.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Not authorized to view invitations for this event");
        }

        List<Invitation> invitations = invitationRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        return invitations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> acceptInvitation(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        // Validate status
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is not in pending state");
        }

        // Validate expiration
        if (LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new IllegalArgumentException("Invitation has expired");
        }

        // Update status
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);
        log.info("Invitation {} accepted for event {}", invitation.getId(), invitation.getEventId());

        // Get event details for response
        Event event = eventRepository.findById(invitation.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Invitation accepted successfully");
        response.put("eventId", event.getId());
        response.put("eventTitle", event.getTitle());
        return response;
    }

    @Transactional
    public Map<String, Object> declineInvitation(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        // Validate status
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is not in pending state");
        }

        // Update status
        invitation.setStatus(InvitationStatus.DECLINED);
        invitationRepository.save(invitation);
        log.info("Invitation {} declined for event {}", invitation.getId(), invitation.getEventId());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Invitation declined");
        return response;
    }

    private void publishInvitationRequestedEvent(Invitation invitation, Event event, User inviter) {
        try {
            InvitationRequestedEvent domainEvent = new InvitationRequestedEvent(
                    event.getId(),
                    invitation.getId(),
                    event.getTitle(),
                    inviter.getId(),
                    inviter.getUsername(),
                    invitation.getInviteeEmail(),
                    invitation.getToken(),
                    event.getAddress(),
                    event.getCity() != null ? event.getCity() : "",
                    event.getStartAt().toString()
            );
            eventPublisher.publish(domainEvent);

            log.info("Published INVITATION_REQUESTED event for invitation {}", invitation.getId());
        } catch (Exception e) {
            log.error("Failed to publish invitation requested event", e);
            // Don't fail the transaction if event publishing fails
        }
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[64];
        SECURE_RANDOM.nextBytes(randomBytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : randomBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private InvitationResponse mapToResponse(Invitation invitation) {
        return InvitationResponse.builder()
                .id(invitation.getId())
                .eventId(invitation.getEventId())
                .inviteeEmail(maskEmail(invitation.getInviteeEmail()))
                .status(invitation.getStatus())
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .build();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        String localPart = parts[0];
        if (localPart.length() <= 3) {
            return localPart.charAt(0) + "***@" + parts[1];
        }
        return localPart.substring(0, 3) + "***@" + parts[1];
    }
}
