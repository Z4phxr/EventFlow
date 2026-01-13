package com.eventflow.registrations.controller;

import com.eventflow.registrations.dto.RegistrationResponse;
import com.eventflow.registrations.service.RegistrationService;
import com.eventflow.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/registrations")
@RequiredArgsConstructor
@Tag(name = "Registrations", description = "Event registration endpoints")
@SecurityRequirement(name = "bearerAuth")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Register to an event")
    public ResponseEntity<RegistrationResponse> registerToEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal User currentUser
    ) {
        RegistrationResponse response = registrationService.registerToEvent(eventId, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Unregister from an event")
    public ResponseEntity<Void> unregisterFromEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal User currentUser
    ) {
        registrationService.unregisterFromEvent(eventId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Check if current user is registered for an event")
    public ResponseEntity<Boolean> checkRegistration(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean isRegistered = registrationService.isUserRegistered(eventId, currentUser.getId());
        return ResponseEntity.ok(isRegistered);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Get all registrations for an event")
    public ResponseEntity<List<RegistrationResponse>> getEventRegistrations(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal User currentUser
    ) {
        List<RegistrationResponse> registrations = registrationService.getEventRegistrations(eventId, currentUser);
        return ResponseEntity.ok(registrations);
    }
}
