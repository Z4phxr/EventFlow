package com.eventflow.integrations.service;

import com.eventflow.integrations.dto.Coordinates;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeocodingService {

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://nominatim.openstreetmap.org")
            .build();

    public Coordinates geocodeAddress(String address) {
        try {
            JsonNode response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search")
                            .queryParam("q", address)
                            .queryParam("format", "json")
                            .queryParam("limit", 1)
                            .build())
                    .header("User-Agent", "EventFlow/1.0")
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response != null && response.isArray() && response.size() > 0) {
                JsonNode first = response.get(0);
                return Coordinates.builder()
                        .latitude(first.get("lat").asDouble())
                        .longitude(first.get("lon").asDouble())
                        .build();
            }

            log.warn("Could not geocode address: {}", address);
            return null;
        } catch (Exception e) {
            log.error("Error geocoding address: {}", address, e);
            return null;
        }
    }
}
