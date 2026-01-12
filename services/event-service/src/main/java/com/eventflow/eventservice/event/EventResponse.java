package com.eventflow.eventservice.event;

import com.eventflow.eventservice.event.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    
    private UUID id;
    private String title;
    private String description;
    private ZonedDateTime startAt;
    private ZonedDateTime endAt;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private Integer capacity;
    private Integer availableSpots;
    private EventStatus status;
    private UUID organizerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


