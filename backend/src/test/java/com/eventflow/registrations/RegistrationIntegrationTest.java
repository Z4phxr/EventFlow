package com.eventflow.registrations;

import com.eventflow.AbstractIntegrationTest;
import com.eventflow.auth.dto.RegisterRequest;
import com.eventflow.events.dto.EventCreateRequest;
import com.eventflow.events.entity.EventStatus;
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
public class RegistrationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String organizerToken;
    private String userToken;
    private String user2Token;

    @BeforeEach
    public void setup() throws Exception {
        RegisterRequest organizerRequest = RegisterRequest.builder()
                .username("organizer_" + System.currentTimeMillis())
                .email("organizer_reg@example.com")
                .password("password123")
                .role(UserRole.ORGANIZER)
                .build();

        MvcResult organizerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(organizerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode organizerNode = objectMapper.readTree(organizerResult.getResponse().getContentAsString());
        organizerToken = organizerNode.get("token").asText();

        RegisterRequest userRequest = RegisterRequest.builder()
                .username("user1_" + System.currentTimeMillis())
                .email("user1_reg@example.com")
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
        RegisterRequest user2Request = RegisterRequest.builder()
                .username("user2_" + System.currentTimeMillis())
                .email("user2_reg@example.com")
                .password("password123")
                .role(UserRole.USER)
                .build();

        MvcResult user2Result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user2Request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode user2Node = objectMapper.readTree(user2Result.getResponse().getContentAsString());
        user2Token = user2Node.get("token").asText();
    }

    @Test
    public void shouldRegisterToEventSuccessfully() throws Exception {
        String eventId = createEvent(organizerToken, "Registration Test Event", 10);

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventId").value(eventId))
                .andExpect(jsonPath("$.status").value("REGISTERED"));
    }

    @Test
    public void shouldPreventRegistrationWhenCapacityFull() throws Exception {
        String eventId = createEvent(organizerToken, "Full Event", 1);

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Event is full"));
    }

    @Test
    public void shouldPreventDuplicateRegistration() throws Exception {
        String eventId = createEvent(organizerToken, "Duplicate Test Event", 10);

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Already registered to this event"));
    }

    @Test
    public void shouldPreventRegistrationToCancelledEvent() throws Exception {
        String eventId = createEvent(organizerToken, "Cancelled Event", 10);


        String updateJson = "{\"status\": \"CANCELLED\"}";
        mockMvc.perform(put("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot register to cancelled or finished event"));
    }

    @Test
    public void shouldPreventRegistrationToFinishedEvent() throws Exception {
        String eventId = createEvent(organizerToken, "Finished Event", 10);

        String updateJson = "{\"status\": \"FINISHED\"}";
        mockMvc.perform(put("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot register to cancelled or finished event"));
    }

    @Test
    public void shouldPreventOrganizerFromRegisteringToOwnEvent() throws Exception {

        String eventId = createEvent(organizerToken, "Own Event", 10);

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + organizerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Organizer cannot register as attendee to their own event"));
    }

    @Test
    public void shouldPreventUserFromCreatingEvent() throws Exception {
        EventCreateRequest request = EventCreateRequest.builder()
                .title("Unauthorized Event")
                .description("Should fail")
                .startAt(ZonedDateTime.now().plusDays(10))
                .endAt(ZonedDateTime.now().plusDays(11))
                .address("Test Address")
                .city("TestCity")
                .capacity(50)
                .build();

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void shouldReturn401ForUnauthenticatedRegistrationRequest() throws Exception {
        String eventId = createEvent(organizerToken, "Auth Test Event", 10);
        mockMvc.perform(post("/api/events/" + eventId + "/registrations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void shouldUnregisterFromEventSuccessfully() throws Exception {

        String eventId = createEvent(organizerToken, "Unregister Test Event", 10);

        mockMvc.perform(post("/api/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated());
        mockMvc.perform(delete("/api/events/" + eventId + "/registrations/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());
    }

    @Test
    public void shouldReturn400WhenUnregisteringFromEventNotRegistered() throws Exception {

        String eventId = createEvent(organizerToken, "Not Registered Event", 10);

        mockMvc.perform(delete("/api/events/" + eventId + "/registrations/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Registration not found"));
    }


    private String createEvent(String token, String title, int capacity) throws Exception {
        EventCreateRequest request = EventCreateRequest.builder()
                .title(title)
                .description("Test event for registration")
                .startAt(ZonedDateTime.now().plusDays(30))
                .endAt(ZonedDateTime.now().plusDays(31))
                .address("123 Test Street, Warsaw, Poland")
                .city("Warsaw")
                .capacity(capacity)
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
