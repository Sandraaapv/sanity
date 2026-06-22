package com.productivity.hub.repository;

import com.productivity.hub.model.TaskCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskCategoryRepository extends JpaRepository<TaskCategory, UUID> {
    List<TaskCategory> findByUserIdOrderByCreatedAtAsc(UUID userId);
    Optional<TaskCategory> findByIdAndUserId(UUID id, UUID userId);
}
