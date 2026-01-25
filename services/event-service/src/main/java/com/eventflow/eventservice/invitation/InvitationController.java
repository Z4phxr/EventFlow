package com.eventflow.eventservice.invitation;

import com.eventflow.eventservice.invitation.dto.InvitationCreateRequest;
import com.eventflow.eventservice.invitation.dto.InvitationResponse;
import com.eventflow.eventservice.security.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Invitations", description = "Event invitation management endpoints")
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/events/{eventId}/invitations")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create an invitation for an event")
    public ResponseEntity<InvitationResponse> createInvitation(
            @PathVariable UUID eventId,
            @Valid @RequestBody InvitationCreateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        InvitationResponse response = invitationService.createInvitation(eventId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/events/{eventId}/invitations")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get all invitations for an event")
    public ResponseEntity<List<InvitationResponse>> getEventInvitations(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal User currentUser
    ) {
        List<InvitationResponse> invitations = invitationService.getEventInvitations(eventId, currentUser);
        return ResponseEntity.ok(invitations);
    }

        @PostMapping("/invitations/accept")
        @Operation(summary = "Accept an invitation (public, token-based)")
    public ResponseEntity<Map<String, Object>> acceptInvitation(
            @RequestParam String token
    ) {
        Map<String, Object> response = invitationService.acceptInvitation(token);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invitations/verify")
    @Operation(summary = "Verify an invitation without accepting it (public, token-based)")
    public ResponseEntity<Map<String, Object>> verifyInvitation(
            @RequestParam String token
    ) {
        Map<String, Object> response = invitationService.verifyInvitation(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/invitations/accept-register")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Accept invitation and register for event (requires authentication)")
    public ResponseEntity<Map<String, Object>> acceptAndRegisterForEvent(
            @RequestParam String token,
            @AuthenticationPrincipal User currentUser
    ) {
        Map<String, Object> response = invitationService.acceptAndRegisterForEvent(token, currentUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/invitations/decline")
    @Operation(summary = "Decline an invitation (public, token-based)")
    public ResponseEntity<Map<String, Object>> declineInvitation(
            @RequestParam String token
    ) {
        Map<String, Object> response = invitationService.declineInvitation(token);
        return ResponseEntity.ok(response);
    }
}
