package com.eventflow.eventservice.registration;

import com.eventflow.eventservice.common.events.DomainEventPublisher;
import com.eventflow.eventservice.common.events.UserRegisteredToEvent;
import com.eventflow.eventservice.common.events.UserUnregisteredFromEvent;
import com.eventflow.eventservice.common.exception.BusinessException;
import com.eventflow.eventservice.event.Event;
import com.eventflow.eventservice.event.EventStatus;
import com.eventflow.eventservice.event.EventRepository;
import com.eventflow.eventservice.registration.RegistrationResponse;
import com.eventflow.eventservice.registration.Registration;
import com.eventflow.eventservice.registration.RegistrationStatus;
import com.eventflow.eventservice.registration.RegistrationRepository;
// User entity not in event-service - handled via JWT
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final DomainEventPublisher eventPublisher;

    @Transactional
    public RegistrationResponse registerToEvent(UUID eventId, User currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException("Event not found"));

        // Validate event status
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.FINISHED) {
            throw new BusinessException("Cannot register to cancelled or finished event");
        }

        // Check if user is organizer
        if (event.getOrganizerId().equals(currentUser.getId())) {
            throw new BusinessException("Organizer cannot register as attendee to their own event");
        }

        // Check if already registered
        if (registrationRepository.existsByEventIdAndUserIdAndStatus(
                eventId, currentUser.getId(), RegistrationStatus.REGISTERED)) {
            throw new BusinessException("Already registered to this event");
        }

        // Check capacity
        long activeRegistrations = registrationRepository.countActiveRegistrationsByEventId(eventId);
        if (activeRegistrations >= event.getCapacity()) {
            throw new BusinessException("Event is full");
        }

        Registration registration = Registration.builder()
                .eventId(eventId)
                .userId(currentUser.getId())
                .status(RegistrationStatus.REGISTERED)
                .build();

        registration = registrationRepository.save(registration);

        // TODO: Publish domain event
        eventPublisher.publish(new UserRegisteredToEvent(eventId, currentUser.getId()));

        return mapToResponse(registration);
    }

    @Transactional
    public void unregisterFromEvent(UUID eventId, User currentUser) {
        Registration registration = registrationRepository.findByEventIdAndUserId(eventId, currentUser.getId())
                .orElseThrow(() -> new BusinessException("Registration not found"));

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new BusinessException("Registration already cancelled");
        }

        registration.setStatus(RegistrationStatus.CANCELLED);
        registrationRepository.save(registration);

        // TODO: Publish domain event
        eventPublisher.publish(new UserUnregisteredFromEvent(eventId, currentUser.getId()));
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getEventRegistrations(UUID eventId, User currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException("Event not found"));

        // Check permissions
        if (!event.getOrganizerId().equals(currentUser.getId()) && 
            !currentUser.getRole().name().equals("ADMIN")) {
            throw new AccessDeniedException("You don't have permission to view registrations");
        }

        return registrationRepository.findByEventId(eventId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RegistrationResponse mapToResponse(Registration registration) {
        return RegistrationResponse.builder()
                .id(registration.getId())
                .eventId(registration.getEventId())
                .userId(registration.getUserId())
                .status(registration.getStatus())
                .createdAt(registration.getCreatedAt())
                .build();
    }
}


