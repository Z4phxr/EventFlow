package com.eventflow.events.repository;

import com.eventflow.events.entity.Event;
import com.eventflow.events.entity.EventStatus;
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
    
    @Query("SELECT e FROM Event e WHERE " +
           "(:dateFrom IS NULL OR e.startAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR e.endAt <= :dateTo) AND " +
           "(:city IS NULL OR LOWER(e.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:status IS NULL OR e.status = :status)")
    List<Event> findByFilters(
        @Param("dateFrom") ZonedDateTime dateFrom,
        @Param("dateTo") ZonedDateTime dateTo,
        @Param("city") String city,
        @Param("status") EventStatus status
    );
}
