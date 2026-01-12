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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for GET /api/events/my endpoint
 * Tests RBAC (Role-Based Access Control) for organizer's event retrieval
 */
@AutoConfigureMockMvc
public class MyEventsIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String organizer1Token;
    private String organizer2Token;
    private String adminToken;
    private String userToken;

    @BeforeEach
    public void setup() throws Exception {
        // Register organizer 1
        RegisterRequest org1Request = RegisterRequest.builder()
                .username("organizer1_" + System.currentTimeMillis())
                .email("org1@example.com")
                .password("password123")
                .role(UserRole.ORGANIZER)
                .build();

        MvcResult org1Result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(org1Request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode org1Node = objectMapper.readTree(org1Result.getResponse().getContentAsString());
        organizer1Token = org1Node.get("token").asText();

        // Register organizer 2
        RegisterRequest org2Request = RegisterRequest.builder()
                .username("organizer2_" + System.currentTimeMillis())
                .email("org2@example.com")
                .password("password123")
                .role(UserRole.ORGANIZER)
                .build();

        MvcResult org2Result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(org2Request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode org2Node = objectMapper.readTree(org2Result.getResponse().getContentAsString());
        organizer2Token = org2Node.get("token").asText();

        // Register admin
        RegisterRequest adminRequest = RegisterRequest.builder()
                .username("admin_" + System.currentTimeMillis())
                .email("admin@example.com")
                .password("password123")
                .role(UserRole.ADMIN)
                .build();

        MvcResult adminResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode adminNode = objectMapper.readTree(adminResult.getResponse().getContentAsString());
        adminToken = adminNode.get("token").asText();

        // Register regular user
        RegisterRequest userRequest = RegisterRequest.builder()
                .username("user_" + System.currentTimeMillis())
                .email("user@example.com")
                .password("password123")
                .role(UserRole.USER)
                .build();

        MvcResult userResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode userNode = objectMapper.readTree(userResult.getResponse().getContentAsString());
        userToken = userNode.get("token").asText();
    }

    @Test
    public void organizerCanGetOnlyTheirOwnEvents() throws Exception {
        // Organizer 1 creates 2 events
        createEvent(organizer1Token, "Organizer1 Event 1");
        createEvent(organizer1Token, "Organizer1 Event 2");

        // Organizer 2 creates 1 event
        createEvent(organizer2Token, "Organizer2 Event 1");

        // Organizer 1 calls /api/events/my - should get only their 2 events
        mockMvc.perform(get("/api/events/my")
                        .header("Authorization", "Bearer " + organizer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].title", containsInAnyOrder("Organizer1 Event 1", "Organizer1 Event 2")));

        // Organizer 2 calls /api/events/my - should get only their 1 event
        mockMvc.perform(get("/api/events/my")
                        .header("Authorization", "Bearer " + organizer2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Organizer2 Event 1"));
    }

    @Test
    public void adminCanGetOnlyTheirOwnEvents() throws Exception {
        // Admin creates 1 event
        createEvent(adminToken, "Admin Event");

        // Organizer creates 1 event
        createEvent(organizer1Token, "Organizer Event");

        // Admin calls /api/events/my - should get only their own event
        // Note: /api/events/my returns events by organizerId, so admin sees only events they created
        mockMvc.perform(get("/api/events/my")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Admin Event"));
    }

    @Test
    public void userCannotAccessMyEventsEndpoint() throws Exception {
        // USER role tries to call /api/events/my - should get 403 Forbidden
        mockMvc.perform(get("/api/events/my")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void unauthenticatedCannotAccessMyEventsEndpoint() throws Exception {
        // No token provided - should get 401 Unauthorized
        mockMvc.perform(get("/api/events/my"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void organizerWithNoEventsGetsEmptyList() throws Exception {
        // Organizer with no events created
        mockMvc.perform(get("/api/events/my")
                        .header("Authorization", "Bearer " + organizer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    public void existingEventListEndpointStillWorksAfterWeek2Changes() throws Exception {
        // Regression test: ensure GET /api/events still works
        createEvent(organizer1Token, "Public Event 1");
        createEvent(organizer2Token, "Public Event 2");

        // Public endpoint should return all events (no auth required)
        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));

        // Authenticated call should also work
        mockMvc.perform(get("/api/events")
                        .header("Authorization", "Bearer " + organizer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    public void eventFilteringStillWorksAfterWeek2Changes() throws Exception {
        // Regression test: ensure GET /api/events with filters still works
        createEvent(organizer1Token, "Warsaw Event", "Warsaw");
        createEvent(organizer2Token, "Krakow Event", "Krakow");

        // Filter by city
        mockMvc.perform(get("/api/events")
                        .param("city", "Warsaw"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].city", everyItem(containsString("Warsaw"))));
    }

    // Helper method to create event and return event ID
    private String createEvent(String token, String title) throws Exception {
        return createEvent(token, title, "TestCity");
    }

    private String createEvent(String token, String title, String city) throws Exception {
        EventCreateRequest request = EventCreateRequest.builder()
                .title(title)
                .description("Test event")
                .startAt(ZonedDateTime.now().plusDays(30))
                .endAt(ZonedDateTime.now().plusDays(31))
                .address("123 Test Street")
                .city(city)
                .capacity(50)
                .build();

        MvcResult result = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        JsonNode eventNode = objectMapper.readTree(response);
        return eventNode.get("id").asText();
    }
}
