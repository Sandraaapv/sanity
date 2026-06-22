package com.productivity.hub.repository;

import com.productivity.hub.model.StudySubject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudySubjectRepository extends JpaRepository<StudySubject, UUID> {
    List<StudySubject> findByUserId(UUID userId);
    Optional<StudySubject> findByIdAndUserId(UUID id, UUID userId);
}
