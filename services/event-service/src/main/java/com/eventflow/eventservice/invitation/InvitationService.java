package com.eventflow.eventservice.invitation;

import com.eventflow.eventservice.event.Event;
import com.eventflow.eventservice.event.EventRepository;
import com.eventflow.eventservice.event.EventStatus;
import com.eventflow.eventservice.invitation.dto.InvitationCreateRequest;
import com.eventflow.eventservice.invitation.dto.InvitationResponse;
import com.eventflow.eventservice.common.events.DomainEventPublisher;
import com.eventflow.eventservice.security.User;
import com.eventflow.eventservice.registration.Registration;
import com.eventflow.eventservice.registration.RegistrationRepository;
import com.eventflow.eventservice.registration.RegistrationStatus;
import com.eventflow.eventservice.common.events.UserRegisteredToEvent;
import com.eventflow.eventservice.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings({"NullableProblems", "DataFlowIssue"})
public class InvitationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationService.class);

    private final InvitationRepository invitationRepository;
    private final EventRepository eventRepository;
    private final DomainEventPublisher eventPublisher;
    private final RegistrationRepository registrationRepository;
    private final RestTemplate restTemplate;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    
    @Value("${services.user-service.url:http://user-service:8081}")
    private String userServiceUrl;

    @Transactional
    public InvitationResponse createInvitation(UUID eventId, InvitationCreateRequest request, User currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));


        log.info("User {} sending invitation for event {} to {}", 
                currentUser.getUsername(), eventId, request.getEmail());

        if (invitationRepository.existsByEventIdAndInviteeEmailAndStatus(
                eventId, request.getEmail().toLowerCase(), InvitationStatus.PENDING)) {
            throw new IllegalArgumentException("A pending invitation already exists for this email");
        }

        String token = generateSecureToken();

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

        publishInvitationRequestedEvent(invitation, event, currentUser);

        return mapToResponse(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getEventInvitations(UUID eventId, User currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        List<Invitation> invitations;
        
        if (event.getOrganizerId().equals(currentUser.getId()) || currentUser.getRole().equals("ADMIN")) {
            invitations = invitationRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        } else {
            invitations = invitationRepository.findByEventIdAndInviterUserIdOrderByCreatedAtDesc(eventId, currentUser.getId());
        }
        
        return invitations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Map<String, Object> verifyInvitation(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        // Validate status
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is not in pending state");
        }

        // Validate expiration
        if (LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            throw new IllegalArgumentException("Invitation has expired");
        }

        Event event = eventRepository.findById(invitation.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        
        boolean userExists = checkIfUserExists(invitation.getInviteeEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("eventId", event.getId());
        response.put("eventTitle", event.getTitle());
        response.put("eventDescription", event.getDescription());
        response.put("eventAddress", event.getAddress());
        response.put("eventDate", event.getStartAt());
        response.put("inviteeEmail", invitation.getInviteeEmail());
        response.put("userExists", userExists);
        
        return response;
    }
    
    private boolean checkIfUserExists(String email) {
        try {
            String url = userServiceUrl + "/api/auth/check-email?email=" + email;
            Boolean exists = restTemplate.getForObject(url, Boolean.class);
            return exists != null && exists;
        } catch (Exception e) {
            log.error("Failed to check if user exists: {}", e.getMessage());
            return false;
        }
    }

    @Transactional
    public Map<String, Object> acceptAndRegisterForEvent(String token, User currentUser) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is not in pending state");
        }

        if (LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new IllegalArgumentException("Invitation has expired");
        }

        if (!invitation.getInviteeEmail().equalsIgnoreCase(currentUser.getEmail())) {
            throw new IllegalArgumentException("This invitation was sent to " + invitation.getInviteeEmail() + 
                                             ". Please log in with that email address.");
        }

        Event event = eventRepository.findById(invitation.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.FINISHED) {
            throw new BusinessException("Cannot register to cancelled or finished event");
        }

        if (event.getOrganizerId().equals(currentUser.getId())) {
            throw new BusinessException("Organizer cannot register as attendee to their own event");
        }

        boolean alreadyRegistered = registrationRepository.existsByEventIdAndUserIdAndStatus(
                invitation.getEventId(), currentUser.getId(), RegistrationStatus.REGISTERED);
        
        if (!alreadyRegistered) {
            long activeRegistrations = registrationRepository.countActiveRegistrationsByEventId(invitation.getEventId());
            if (activeRegistrations >= event.getCapacity()) {
                throw new BusinessException("Event is full");
            }

            Registration registration = Registration.builder()
                    .eventId(invitation.getEventId())
                    .userId(currentUser.getId())
                    .status(RegistrationStatus.REGISTERED)
                    .build();
            registrationRepository.save(registration);

            eventPublisher.publish(new UserRegisteredToEvent(
                    invitation.getEventId(), 
                    currentUser.getId(), 
                    event.getOrganizerId(),
                    event.getTitle()
            ));

            log.info("User {} registered for event {} via invitation", currentUser.getId(), event.getId());
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);
        log.info("Invitation {} accepted for event {}", invitation.getId(), invitation.getEventId());

        Map<String, Object> response = new HashMap<>();
        response.put("message", alreadyRegistered ? 
            "You were already registered for this event!" : 
            "Successfully registered for the event!");
        response.put("eventId", event.getId());
        response.put("eventTitle", event.getTitle());
        response.put("registered", true);
        
        return response;
    }

    @Transactional
    public Map<String, Object> acceptInvitation(String token) {
        return verifyInvitation(token);
    }

    @Transactional
    public Map<String, Object> declineInvitation(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        Map<String, Object> response = new HashMap<>();

        switch (invitation.getStatus()) {
            case DECLINED:
                response.put("message", "This invitation was already declined");
                response.put("alreadyDeclined", true);
                break;
            case ACCEPTED:
                response.put("message", "This invitation was already accepted. Declining won't affect your registration.");
                response.put("alreadyAccepted", true);
                break;
            case EXPIRED:
                response.put("message", "This invitation has expired");
                response.put("expired", true);
                break;
            case PENDING:
            default:
                invitation.setStatus(InvitationStatus.DECLINED);
                invitationRepository.save(invitation);
                log.info("Invitation {} declined for event {}", invitation.getId(), invitation.getEventId());
                response.put("message", "Invitation declined successfully");
                response.put("declined", true);
                break;
        }

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
