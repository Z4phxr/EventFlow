package com.eventflow.eventservice.event;

import com.eventflow.eventservice.event.Event;
import com.eventflow.eventservice.event.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID>, JpaSpecificationExecutor<Event> {
    
    List<Event> findByOrganizerId(UUID organizerId);
    List<Event> findByStatusAndEndAtBefore(EventStatus status, ZonedDateTime time);
}


