package com.eventflow.eventservice.integration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherResponse {
    
    private Double temperature;
    private String condition;
    private Double windSpeed;
    private Integer humidity;
    private String forecast;
}


