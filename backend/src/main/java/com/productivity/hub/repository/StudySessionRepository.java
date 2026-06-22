package com.productivity.hub.repository;

import com.productivity.hub.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {
    List<StudySession> findByUserId(UUID userId);
    List<StudySession> findByUserIdAndStartTimeAfter(UUID userId, Instant startTime);
}
