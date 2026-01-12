package com.eventflow.eventservice.event;

import com.eventflow.eventservice.event.EventStatus;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventUpdateRequest {
    
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;
    
    private String description;
    
    private ZonedDateTime startAt;
    
    private ZonedDateTime endAt;
    
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;
    
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;
    
    @Positive(message = "Capacity must be positive")
    private Integer capacity;
    
    private EventStatus status;
}


