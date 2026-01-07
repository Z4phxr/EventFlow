package com.eventflow.integrations.service;

import com.eventflow.common.exception.BusinessException;
import com.eventflow.integrations.dto.WeatherResponse;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherService {

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.open-meteo.com/v1")
            .build();

    public WeatherResponse getWeatherForecast(Double latitude, Double longitude, ZonedDateTime dateTime) {
        if (latitude == null || longitude == null) {
            throw new BusinessException("Event location coordinates are not available");
        }

        try {
            String date = dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE);
            
            JsonNode response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/forecast")
                            .queryParam("latitude", latitude)
                            .queryParam("longitude", longitude)
                            .queryParam("start_date", date)
                            .queryParam("end_date", date)
                            .queryParam("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum")
                            .queryParam("timezone", "auto")
                            .build())
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response != null && response.has("daily")) {
                JsonNode daily = response.get("daily");
                double tempMax = daily.get("temperature_2m_max").get(0).asDouble();
                double tempMin = daily.get("temperature_2m_min").get(0).asDouble();
                double precipitation = daily.get("precipitation_sum").get(0).asDouble();

                String condition = precipitation > 5 ? "Rainy" : "Clear";
                double avgTemp = (tempMax + tempMin) / 2;

                return WeatherResponse.builder()
                        .temperature(avgTemp)
                        .condition(condition)
                        .windSpeed(0.0) // Open-Meteo free tier doesn't include wind
                        .humidity(0)    // Open-Meteo free tier doesn't include humidity
                        .forecast(String.format("Temperature: %.1f°C, Max: %.1f°C, Min: %.1f°C, Precipitation: %.1fmm", 
                                avgTemp, tempMax, tempMin, precipitation))
                        .build();
            }

            throw new BusinessException("Unable to fetch weather data");
        } catch (Exception e) {
            log.error("Error fetching weather forecast", e);
            throw new BusinessException("Error fetching weather data: " + e.getMessage());
        }
    }
}
