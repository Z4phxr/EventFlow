package com.eventflow.eventservice.event;

import com.eventflow.eventservice.event.Event;
import com.eventflow.eventservice.event.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    
    List<Event> findByOrganizerId(UUID organizerId);
    
    @Query(value = "SELECT * FROM events e WHERE " +
           "(?1 IS NULL OR e.start_at >= CAST(?1 AS TIMESTAMP WITH TIME ZONE)) AND " +
           "(?2 IS NULL OR e.end_at <= CAST(?2 AS TIMESTAMP WITH TIME ZONE)) AND " +
           "(?3 IS NULL OR e.city ILIKE CONCAT('%', ?3, '%')) AND " +
           "(?4 IS NULL OR e.status = ?4)", 
           nativeQuery = true)
    List<Event> findByFilters(
        ZonedDateTime dateFrom,
        ZonedDateTime dateTo,
        String city,
        String status
    );
}


