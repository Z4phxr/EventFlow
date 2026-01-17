package com.eventflow.notificationservice.mail;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${mail.from}")
    private String fromEmail;

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    public void sendInvitationEmail(
            String inviteeEmail,
            String inviterUsername,
            String eventTitle,
            String eventStartAt,
            String eventAddress,
            String eventCity,
            String token
    ) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(inviteeEmail);
            message.setSubject("Invitation to event: " + eventTitle);
            message.setText(buildInvitationEmailBody(
                    inviterUsername, eventTitle, eventStartAt, eventAddress, eventCity, token
            ));

            mailSender.send(message);
            log.info("Successfully sent invitation email to {}", inviteeEmail);
        } catch (Exception e) {
            log.error("Failed to send invitation email to {}", inviteeEmail, e);
            throw new RuntimeException("Failed to send invitation email", e);
        }
    }

    private String buildInvitationEmailBody(
            String inviterUsername,
            String eventTitle,
            String eventStartAt,
            String eventAddress,
            String eventCity,
            String token
    ) {
        String formattedDate = formatEventDate(eventStartAt);
        String acceptUrl = frontendBaseUrl + "/invite/accept?token=" + token;
        String declineUrl = frontendBaseUrl + "/invite/decline?token=" + token;

        return String.format("""
                Hello,
                
                You have been invited by %s to attend an event.
                
                Event: %s
                Date: %s
                Location: %s, %s
                
                To accept this invitation, click here:
                %s
                
                To decline, click here:
                %s
                
                This invitation expires in 48 hours.
                
                EventFlow Team
                """,
                inviterUsername,
                eventTitle,
                formattedDate,
                eventCity,
                eventAddress,
                acceptUrl,
                declineUrl
        );
    }

    private String formatEventDate(String isoDateString) {
        try {
            ZonedDateTime dateTime = ZonedDateTime.parse(isoDateString);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM d, yyyy 'at' h:mm a z");
            return dateTime.format(formatter);
        } catch (Exception e) {
            log.warn("Failed to parse date: {}", isoDateString);
            return isoDateString;
        }
    }
}
