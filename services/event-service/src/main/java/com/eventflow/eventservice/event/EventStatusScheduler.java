package com.eventflow.eventservice.event;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EventStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(EventStatusScheduler.class);

    private final EventRepository eventRepository;

    @Scheduled(fixedDelayString = "${event.status.scheduler.delay:60000}")
    @Transactional
    public void markPastEventsAsFinished() {
        ZonedDateTime now = ZonedDateTime.now();
        List<Event> toFinish = eventRepository.findByStatusAndEndAtBefore(EventStatus.PLANNED, now);
        if (toFinish.isEmpty()) return;

        log.info("Marking {} events as FINISHED (endAt before {})", toFinish.size(), now);
        toFinish.forEach(ev -> ev.setStatus(EventStatus.FINISHED));
        eventRepository.saveAll(toFinish);
    }
}
