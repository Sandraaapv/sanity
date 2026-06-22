package com.productivity.hub.repository;

import com.productivity.hub.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByUserIdAndStartsAtBetweenOrderByStartsAtAsc(UUID userId, Instant start, Instant end);
    List<Event> findByUserIdOrderByStartsAtAsc(UUID userId);
    Optional<Event> findByIdAndUserId(UUID id, UUID userId);
}
