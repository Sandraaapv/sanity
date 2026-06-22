package com.productivity.hub.controller;

import com.productivity.hub.model.Task;
import com.productivity.hub.model.TaskCategory;
import com.productivity.hub.model.User;
import com.productivity.hub.repository.TaskCategoryRepository;
import com.productivity.hub.repository.TaskRepository;
import com.productivity.hub.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskCategoryRepository categoryRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskController(TaskCategoryRepository categoryRepository,
                          TaskRepository taskRepository,
                          UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    // --- CATEGORIES CRUD ---

    @GetMapping("/task-categories")
    public ResponseEntity<List<CategoryDto>> getCategories(@AuthenticationPrincipal UUID userId) {
        List<TaskCategory> categories = categoryRepository.findByUserIdOrderByCreatedAtAsc(userId);
        List<CategoryDto> dtos = categories.stream()
                .map(CategoryDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/task-categories")
    public ResponseEntity<?> createCategory(@AuthenticationPrincipal UUID userId, @RequestBody CategoryRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Category name is required");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        TaskCategory category = new TaskCategory();
        category.setUser(user);
        category.setName(request.getName().trim());
        category.setColor(request.getColor() != null ? request.getColor() : "#c4b5fd");
        category.setDeadline(request.getDeadline());

        TaskCategory saved = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CategoryDto(saved));
    }

    @PutMapping("/task-categories/{id}")
    public ResponseEntity<?> updateCategory(@AuthenticationPrincipal UUID userId,
                                            @PathVariable UUID id,
                                            @RequestBody CategoryRequest request) {
        TaskCategory category = categoryRepository.findByIdAndUserId(id, userId).orElse(null);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Category not found");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            category.setName(request.getName().trim());
        }
        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }
        // Allows setting to null explicitly
        category.setDeadline(request.getDeadline());

        TaskCategory updated = categoryRepository.save(category);
        return ResponseEntity.ok(new CategoryDto(updated));
    }

    @DeleteMapping("/task-categories/{id}")
    @Transactional
    public ResponseEntity<?> deleteCategory(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        TaskCategory category = categoryRepository.findByIdAndUserId(id, userId).orElse(null);
        if (category == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Category not found");
        }

        // Delete all tasks in this category
        taskRepository.deleteByCategoryId(id);

        categoryRepository.delete(category);
        return ResponseEntity.noContent().build();
    }

    // --- TASKS CRUD ---

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto>> getTasks(@AuthenticationPrincipal UUID userId) {
        List<Task> tasks = taskRepository.findByUserIdOrderByCreatedAtAsc(userId);
        List<TaskDto> dtos = tasks.stream()
                .map(TaskDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/tasks")
    public ResponseEntity<?> createTask(@AuthenticationPrincipal UUID userId, @RequestBody TaskRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Task title is required");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        TaskCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId).orElse(null);
            if (category == null) {
                return ResponseEntity.badRequest().body("Invalid category ID");
            }
        }

        Task task = new Task();
        task.setUser(user);
        task.setCategory(category);
        task.setTitle(request.getTitle().trim());
        task.setPriority(request.getPriority() != null ? request.getPriority() : "medium");
        task.setCompleted(request.getCompleted() != null && request.getCompleted());

        Task saved = taskRepository.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(new TaskDto(saved));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<?> updateTask(@AuthenticationPrincipal UUID userId,
                                        @PathVariable UUID id,
                                        @RequestBody TaskRequest request) {
        Task task = taskRepository.findByIdAndUserId(id, userId).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Task not found");
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            task.setTitle(request.getTitle().trim());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getCompleted() != null) {
            task.setCompleted(request.getCompleted());
        }
        if (request.getCategoryId() != null) {
            TaskCategory category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId).orElse(null);
            if (category != null) {
                task.setCategory(category);
            }
        }

        Task updated = taskRepository.save(task);
        return ResponseEntity.ok(new TaskDto(updated));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteTask(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        Task task = taskRepository.findByIdAndUserId(id, userId).orElse(null);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Task not found");
        }

        taskRepository.delete(task);
        return ResponseEntity.noContent().build();
    }

    // --- DTO & REQUEST Classes ---

    public static class CategoryDto {
        private UUID id;
        private String name;
        private String color;
        private Instant deadline;

        public CategoryDto(TaskCategory cat) {
            this.id = cat.getId();
            this.name = cat.getName();
            this.color = cat.getColor();
            this.deadline = cat.getDeadline();
        }

        public UUID getId() { return id; }
        public String getName() { return name; }
        public String getColor() { return color; }
        public Instant getDeadline() { return deadline; }
    }

    public static class CategoryRequest {
        private String name;
        private String color;
        private Instant deadline;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public Instant getDeadline() { return deadline; }
        public void setDeadline(Instant deadline) { this.deadline = deadline; }
    }

    public static class TaskDto {
        private UUID id;
        private UUID category_id; // match client key names
        private String title;
        private String priority;
        private boolean completed;

        public TaskDto(Task task) {
            this.id = task.getId();
            this.category_id = task.getCategory() != null ? task.getCategory().getId() : null;
            this.title = task.getTitle();
            this.priority = task.getPriority();
            this.completed = task.isCompleted();
        }

        public UUID getId() { return id; }
        public UUID getCategory_id() { return category_id; }
        public String getTitle() { return title; }
        public String getPriority() { return priority; }
        public boolean isCompleted() { return completed; }
    }

    public static class TaskRequest {
        private String title;
        private String priority;
        private Boolean completed;
        private UUID categoryId;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public Boolean getCompleted() { return completed; }
        public void setCompleted(Boolean completed) { this.completed = completed; }
        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    }
}
