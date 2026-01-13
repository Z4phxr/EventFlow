package com.eventflow.events.repository;

import com.eventflow.events.entity.Event;
import com.eventflow.events.entity.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID>, JpaSpecificationExecutor<Event> {
    
    List<Event> findByOrganizerId(UUID organizerId);
}
