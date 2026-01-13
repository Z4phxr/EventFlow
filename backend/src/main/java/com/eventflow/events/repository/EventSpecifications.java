package com.eventflow.events.repository;

import com.eventflow.events.entity.Event;
import com.eventflow.events.entity.EventStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class EventSpecifications {
    
    public static Specification<Event> withFilters(ZonedDateTime dateFrom, ZonedDateTime dateTo, String city, EventStatus status) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (dateFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startAt"), dateFrom));
            }
            
            if (dateTo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("endAt"), dateTo));
            }
            
            if (city != null && !city.isBlank()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("city")),
                    "%" + city.toLowerCase() + "%"
                ));
            }
            
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
