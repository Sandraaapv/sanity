package com.productivity.hub.repository;

import com.productivity.hub.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {
    List<Note> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Note> findByIdAndUserId(UUID id, UUID userId);
}
