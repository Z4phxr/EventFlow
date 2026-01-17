package com.eventflow.eventservice.registration;

import com.eventflow.eventservice.registration.Registration;
import com.eventflow.eventservice.registration.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, UUID> {
    
    List<Registration> findByEventId(UUID eventId);
    
    List<Registration> findByUserId(UUID userId);
    
    Optional<Registration> findByEventIdAndUserId(UUID eventId, UUID userId);
    
    boolean existsByEventIdAndUserIdAndStatus(UUID eventId, UUID userId, RegistrationStatus status);
    
    @Query("SELECT COUNT(r) FROM Registration r WHERE r.eventId = :eventId AND r.status = 'REGISTERED'")
    long countActiveRegistrationsByEventId(UUID eventId);
}


