package com.eventflow.integrations.dto;

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
    private Double temperatureMax;
    private Double temperatureMin;
    private String condition;
    private Double windSpeed;
    private Integer humidity;  // Using as rain probability %
    private Double precipitation;
    private Integer weatherCode;
    private String forecast;
}
