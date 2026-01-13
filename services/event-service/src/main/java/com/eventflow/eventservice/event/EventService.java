package com.eventflow.eventservice.event;

import com.eventflow.eventservice.common.events.DomainEventPublisher;
import com.eventflow.eventservice.common.events.EventCreated;
import com.eventflow.eventservice.common.events.EventUpdated;
import com.eventflow.eventservice.common.events.EventDeleted;
import com.eventflow.eventservice.common.exception.BusinessException;
import com.eventflow.eventservice.event.EventCreateRequest;
import com.eventflow.eventservice.event.EventResponse;
import com.eventflow.eventservice.event.EventUpdateRequest;
import com.eventflow.eventservice.event.Event;
import com.eventflow.eventservice.event.EventStatus;
import com.eventflow.eventservice.event.EventRepository;
import com.eventflow.eventservice.integration.GeocodingService;
import com.eventflow.eventservice.registration.RegistrationRepository;
import com.eventflow.eventservice.security.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final GeocodingService geocodingService;
    private final DomainEventPublisher eventPublisher;

    @Transactional
    public EventResponse createEvent(EventCreateRequest request, User currentUser) {
        // Validate dates
        if (request.getEndAt().isBefore(request.getStartAt())) {
            throw new BusinessException("End date must be after start date");
        }

        // Geocode address
        var coordinates = geocodingService.geocodeAddress(request.getAddress());

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(coordinates != null ? coordinates.getLatitude() : null)
                .longitude(coordinates != null ? coordinates.getLongitude() : null)
                .capacity(request.getCapacity())
                .status(EventStatus.PLANNED)
                .organizerId(currentUser.getId())
                .build();

        event = eventRepository.save(event);

        // TODO: Publish domain event - will be replaced with RabbitMQ later
        eventPublisher.publish(new EventCreated(event.getId(), event.getTitle(), event.getOrganizerId()));

        return mapToResponse(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getEvents(ZonedDateTime dateFrom, ZonedDateTime dateTo, String city, EventStatus status) {
        // If no filters provided, just return all events
        if (dateFrom == null && dateTo == null && city == null && status == null) {
            return eventRepository.findAll()
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        String statusStr = status != null ? status.name() : null;
        return eventRepository.findByFilters(dateFrom, dateTo, city, statusStr)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getMyEvents(User currentUser) {
        return eventRepository.findByOrganizerId(currentUser.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventResponse getEvent(UUID id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Event not found"));
        return mapToResponse(event);
    }

    @Transactional
    public EventResponse updateEvent(UUID id, EventUpdateRequest request, User currentUser) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Event not found"));

        // Check permissions
        if (!event.getOrganizerId().equals(currentUser.getId()) && 
            !"ADMIN".equals(currentUser.getRole())) {
            throw new AccessDeniedException("You don't have permission to update this event");
        }

        // Update fields if provided
        if (request.getTitle() != null) {
            event.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getStartAt() != null) {
            event.setStartAt(request.getStartAt());
        }
        if (request.getEndAt() != null) {
            event.setEndAt(request.getEndAt());
        }
        if (request.getAddress() != null) {
            event.setAddress(request.getAddress());
            // Re-geocode if address changed
            var coordinates = geocodingService.geocodeAddress(request.getAddress());
            event.setLatitude(coordinates != null ? coordinates.getLatitude() : null);
            event.setLongitude(coordinates != null ? coordinates.getLongitude() : null);
        }
        if (request.getCity() != null) {
            event.setCity(request.getCity());
        }
        if (request.getCapacity() != null) {
            event.setCapacity(request.getCapacity());
        }
        if (request.getStatus() != null) {
            event.setStatus(request.getStatus());
        }

        event = eventRepository.save(event);

        // TODO: Publish domain event
        eventPublisher.publish(new EventUpdated(event.getId(), event.getTitle()));

        return mapToResponse(event);
    }

    @Transactional
    public void deleteEvent(UUID id, User currentUser) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Event not found"));

        // Check permissions
        if (!event.getOrganizerId().equals(currentUser.getId()) && 
            !"ADMIN".equals(currentUser.getRole())) {
            throw new AccessDeniedException("You don't have permission to delete this event");
        }

        // Publish domain event before deletion
        eventPublisher.publish(new EventDeleted(event.getId(), event.getTitle(), event.getOrganizerId()));

        eventRepository.delete(event);
    }

    private EventResponse mapToResponse(Event event) {
        long activeRegistrations = registrationRepository.countActiveRegistrationsByEventId(event.getId());
        int availableSpots = event.getCapacity() - (int) activeRegistrations;

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startAt(event.getStartAt())
                .endAt(event.getEndAt())
                .address(event.getAddress())
                .city(event.getCity())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .capacity(event.getCapacity())
                .availableSpots(availableSpots)
                .status(event.getStatus())
                .organizerId(event.getOrganizerId())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}


