package com.eventflow.eventservice.integration;

import com.eventflow.eventservice.integration.Coordinates;
import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Service for geocoding addresses to coordinates using OpenStreetMap Nominatim API.
 * Implements simple in-memory caching to reduce API calls for repeated addresses.
 */
@Service
@RequiredArgsConstructor
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);

    private final Map<String, Coordinates> geocodeCache = new ConcurrentHashMap<>();

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://nominatim.openstreetmap.org")
            .clientConnector(new ReactorClientHttpConnector(
                    HttpClient.create()
                            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                            .responseTimeout(Duration.ofSeconds(5))
                            .doOnConnected(conn -> conn
                                    .addHandlerLast(new ReadTimeoutHandler(5, TimeUnit.SECONDS))
                                    .addHandlerLast(new WriteTimeoutHandler(5, TimeUnit.SECONDS)))
            ))
            .build();

    public Coordinates geocodeAddress(String address) {
        Coordinates cached = geocodeCache.get(address);
        if (cached != null) {
            log.debug("Cache hit for address: {}", address);
            return cached;
        }

        log.debug("Cache miss for address: {}, calling API", address);
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
                Coordinates coordinates = Coordinates.builder()
                        .latitude(first.get("lat").asDouble())
                        .longitude(first.get("lon").asDouble())
                        .build();
                
                geocodeCache.put(address, coordinates);
                log.debug("Cached coordinates for address: {}", address);
                return coordinates;
            }

            log.warn("Could not geocode address: {}", address);
            return null;
        } catch (Exception e) {
            log.error("Error geocoding address: {}", address, e);
            return null;
        }
    }
}


