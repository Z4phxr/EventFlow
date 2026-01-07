package com.eventflow.events;

import com.eventflow.AbstractIntegrationTest;
import com.eventflow.auth.dto.RegisterRequest;
import com.eventflow.events.dto.EventCreateRequest;
import com.eventflow.users.entity.UserRole;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.ZonedDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
public class EventIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String organizerToken;

    @BeforeEach
    public void setup() throws Exception {
        // Register organizer
        RegisterRequest registerRequest = RegisterRequest.builder()
                .username("organizer_" + System.currentTimeMillis())
                .email("organizer@example.com")
                .password("password123")
                .role(UserRole.ORGANIZER)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(response);
        organizerToken = jsonNode.get("token").asText();
    }

    @Test
    public void shouldCreateEvent() throws Exception {
        EventCreateRequest request = EventCreateRequest.builder()
                .title("Tech Conference 2026")
                .description("Annual tech conference")
                .startAt(ZonedDateTime.now().plusDays(30))
                .endAt(ZonedDateTime.now().plusDays(31))
                .address("123 Tech Street, Warsaw, Poland")
                .city("Warsaw")
                .capacity(100)
                .build();

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Tech Conference 2026"))
                .andExpect(jsonPath("$.city").value("Warsaw"))
                .andExpect(jsonPath("$.capacity").value(100))
                .andExpect(jsonPath("$.status").value("PLANNED"));
    }

    @Test
    public void shouldGetAllEvents() throws Exception {
        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    public void shouldUpdateEvent() throws Exception {
        // Create event
        EventCreateRequest createRequest = EventCreateRequest.builder()
                .title("Original Title")
                .description("Original description")
                .startAt(ZonedDateTime.now().plusDays(30))
                .endAt(ZonedDateTime.now().plusDays(31))
                .address("Original Address")
                .city("Warsaw")
                .capacity(50)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String createResponse = createResult.getResponse().getContentAsString();
        JsonNode eventNode = objectMapper.readTree(createResponse);
        String eventId = eventNode.get("id").asText();

        // Update event
        String updateJson = "{\"title\": \"Updated Title\", \"capacity\": 75}";

        mockMvc.perform(put("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.capacity").value(75));
    }

    @Test
    public void shouldDeleteEvent() throws Exception {
        // Create event
        EventCreateRequest createRequest = EventCreateRequest.builder()
                .title("Event to Delete")
                .description("This will be deleted")
                .startAt(ZonedDateTime.now().plusDays(30))
                .endAt(ZonedDateTime.now().plusDays(31))
                .address("Delete Street")
                .city("TestCity")
                .capacity(20)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String createResponse = createResult.getResponse().getContentAsString();
        JsonNode eventNode = objectMapper.readTree(createResponse);
        String eventId = eventNode.get("id").asText();

        // Delete event
        mockMvc.perform(delete("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + organizerToken))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/api/events/" + eventId))
                .andExpect(status().isBadRequest());
    }
}
