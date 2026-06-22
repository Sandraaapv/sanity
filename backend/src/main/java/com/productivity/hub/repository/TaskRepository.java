package com.productivity.hub.repository;

import com.productivity.hub.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUserIdOrderByCreatedAtAsc(UUID userId);
    Optional<Task> findByIdAndUserId(UUID id, UUID userId);
    void deleteByCategoryId(UUID categoryId);
}
