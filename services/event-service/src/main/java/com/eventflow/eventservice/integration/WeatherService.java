package com.eventflow.eventservice.integration;

import com.eventflow.eventservice.common.exception.BusinessException;
import com.eventflow.eventservice.integration.WeatherResponse;
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
                            .queryParam("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code")
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
                
                // Get rain probability (0-100)
                int rainProbability = daily.has("precipitation_probability_max") && !daily.get("precipitation_probability_max").get(0).isNull() 
                        ? daily.get("precipitation_probability_max").get(0).asInt() 
                        : 0;
                
                // Get wind speed in km/h
                double windSpeed = daily.has("wind_speed_10m_max") && !daily.get("wind_speed_10m_max").get(0).isNull()
                        ? daily.get("wind_speed_10m_max").get(0).asDouble()
                        : 0.0;
                
                // Get weather code for condition
                int weatherCode = daily.has("weather_code") && !daily.get("weather_code").get(0).isNull()
                        ? daily.get("weather_code").get(0).asInt()
                        : 0;

                // Map weather code to condition
                String condition = getConditionFromCode(weatherCode, precipitation);
                double avgTemp = (tempMax + tempMin) / 2;

                return WeatherResponse.builder()
                        .temperature(avgTemp)
                        .temperatureMax(tempMax)
                        .temperatureMin(tempMin)
                        .condition(condition)
                        .windSpeed(windSpeed)
                        .humidity(rainProbability) // Rain probability percentage
                        .precipitation(precipitation)
                        .weatherCode(weatherCode)
                        .forecast(String.format("Temperature: %.1f°C, Max: %.1f°C, Min: %.1f°C, Precipitation: %.1fmm, Wind: %.1f km/h", 
                                avgTemp, tempMax, tempMin, precipitation, windSpeed))
                        .build();
            }

            throw new BusinessException("Unable to fetch weather data");
        } catch (Exception e) {
            log.error("Error fetching weather forecast", e);
            throw new BusinessException("Error fetching weather data: " + e.getMessage());
        }
    }
    
    private String getConditionFromCode(int code, double precipitation) {
        // WMO Weather interpretation codes
        if (code == 0) return "Clear sky";
        if (code <= 2) return "Partly cloudy";
        if (code == 3) return "Overcast";
        if (code >= 45 && code <= 48) return "Foggy";
        if (code >= 51 && code <= 55) return "Drizzle";
        if (code >= 61 && code <= 65) return "Rain";
        if (code >= 66 && code <= 67) return "Freezing rain";
        if (code >= 71 && code <= 77) return "Snow";
        if (code >= 80 && code <= 82) return "Rain showers";
        if (code >= 85 && code <= 86) return "Snow showers";
        if (code >= 95) return "Thunderstorm";
        return precipitation > 5 ? "Rainy" : "Clear";
    }
}


