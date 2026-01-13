package com.eventflow.integrations.service;

import com.eventflow.common.exception.BusinessException;
import com.eventflow.integrations.dto.WeatherResponse;
import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherService {

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.open-meteo.com/v1")
            .clientConnector(new ReactorClientHttpConnector(
                    HttpClient.create()
                            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                            .responseTimeout(Duration.ofSeconds(5))
                            .doOnConnected(conn -> conn
                                    .addHandlerLast(new ReadTimeoutHandler(5, TimeUnit.SECONDS))
                                    .addHandlerLast(new WriteTimeoutHandler(5, TimeUnit.SECONDS)))
            ))
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
                            .queryParam("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,weathercode")
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
                int precipProbability = daily.has("precipitation_probability_max") ? daily.get("precipitation_probability_max").get(0).asInt() : 0;
                double windSpeed = daily.has("windspeed_10m_max") ? daily.get("windspeed_10m_max").get(0).asDouble() : 0;
                int weatherCode = daily.has("weathercode") ? daily.get("weathercode").get(0).asInt() : 0;

                String condition = getWeatherCondition(weatherCode);
                double avgTemp = (tempMax + tempMin) / 2;

                return WeatherResponse.builder()
                        .temperature(avgTemp)
                        .temperatureMax(tempMax)
                        .temperatureMin(tempMin)
                        .condition(condition)
                        .windSpeed(windSpeed)
                        .humidity(precipProbability) // Using precipitation probability as indicator
                        .precipitation(precipitation)
                        .weatherCode(weatherCode)
                        .forecast(String.format("%.0f°C (%.0f° - %.0f°C), %s", avgTemp, tempMin, tempMax, condition))
                        .build();
            }

            throw new BusinessException("Unable to fetch weather data");
        } catch (Exception e) {
            log.error("Error fetching weather forecast", e);
            throw new BusinessException("Error fetching weather data: " + e.getMessage());
        }
    }

    private String getWeatherCondition(int code) {
        // WMO Weather interpretation codes
        return switch (code) {
            case 0 -> "Clear sky";
            case 1 -> "Mainly clear";
            case 2 -> "Partly cloudy";
            case 3 -> "Overcast";
            case 45, 48 -> "Foggy";
            case 51, 53, 55 -> "Light drizzle";
            case 56, 57 -> "Freezing drizzle";
            case 61, 63, 65 -> "Rainy";
            case 66, 67 -> "Freezing rain";
            case 71, 73, 75 -> "Snowy";
            case 77 -> "Snow grains";
            case 80, 81, 82 -> "Rain showers";
            case 85, 86 -> "Snow showers";
            case 95 -> "Thunderstorm";
            case 96, 99 -> "Thunderstorm with hail";
            default -> "Unknown";
        };
    }
}
