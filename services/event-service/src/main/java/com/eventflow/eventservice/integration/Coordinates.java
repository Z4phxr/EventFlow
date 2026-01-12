package com.eventflow.eventservice.integration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coordinates {
    private Double latitude;
    private Double longitude;
}


