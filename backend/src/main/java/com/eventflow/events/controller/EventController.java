package com.eventflow.events.controller;

import com.eventflow.events.dto.EventCreateRequest;
import com.eventflow.events.dto.EventResponse;
import com.eventflow.events.dto.EventUpdateRequest;
import com.eventflow.events.entity.EventStatus;
import com.eventflow.events.service.EventService;
import com.eventflow.integrations.dto.WeatherResponse;
import com.eventflow.integrations.service.WeatherService;
import com.eventflow.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event management endpoints")
public class EventController {

    private final EventService eventService;
    private final WeatherService weatherService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new event")
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventCreateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        EventResponse response = eventService.createEvent(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all events with optional filters")
    public ResponseEntity<List<EventResponse>> getEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) ZonedDateTime dateTo,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) EventStatus status
    ) {
        List<EventResponse> events = eventService.getEvents(dateFrom, dateTo, city, status);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get event by ID")
    public ResponseEntity<EventResponse> getEvent(@PathVariable UUID id) {
        EventResponse response = eventService.getEvent(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update an event")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody EventUpdateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        EventResponse response = eventService.updateEvent(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete an event")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser
    ) {
        eventService.deleteEvent(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/weather")
    @Operation(summary = "Get weather forecast for event")
    public ResponseEntity<WeatherResponse> getEventWeather(@PathVariable UUID id) {
        EventResponse event = eventService.getEvent(id);
        WeatherResponse weather = weatherService.getWeatherForecast(
                event.getLatitude(),
                event.getLongitude(),
                event.getStartAt()
        );
        return ResponseEntity.ok(weather);
    }
}
