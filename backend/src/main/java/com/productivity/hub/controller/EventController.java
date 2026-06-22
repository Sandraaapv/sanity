package com.productivity.hub.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.productivity.hub.model.Event;
import com.productivity.hub.model.User;
import com.productivity.hub.repository.EventRepository;
import com.productivity.hub.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventController(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<EventDto>> getEvents(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(value = "from", required = false) String fromStr,
            @RequestParam(value = "to", required = false) String toStr) {

        List<Event> events;
        if (fromStr != null && toStr != null) {
            Instant from = Instant.parse(fromStr);
            Instant to = Instant.parse(toStr);
            events = eventRepository.findByUserIdAndStartsAtBetweenOrderByStartsAtAsc(userId, from, to);
        } else {
            events = eventRepository.findByUserIdOrderByStartsAtAsc(userId);
        }

        List<EventDto> dtos = events.stream()
                .map(EventDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@AuthenticationPrincipal UUID userId, @RequestBody EventRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Event title is required");
        }
        if (request.getStartsAt() == null) {
            return ResponseEntity.badRequest().body("Start time is required");
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        Event event = new Event();
        event.setUser(user);
        event.setTitle(request.getTitle().trim());
        event.setDescription(request.getDescription());
        event.setStartsAt(request.getStartsAt());
        event.setEndsAt(request.getEndsAt());
        event.setColor(request.getColor() != null ? request.getColor() : "#c4b5fd");

        Event saved = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(new EventDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@AuthenticationPrincipal UUID userId,
                                         @PathVariable UUID id,
                                         @RequestBody EventRequest request) {
        Event event = eventRepository.findByIdAndUserId(id, userId).orElse(null);
        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Event not found");
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            event.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getStartsAt() != null) {
            event.setStartsAt(request.getStartsAt());
        }
        // Allows setting to null explicitly
        event.setEndsAt(request.getEndsAt());
        if (request.getColor() != null) {
            event.setColor(request.getColor());
        }

        Event updated = eventRepository.save(event);
        return ResponseEntity.ok(new EventDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        Event event = eventRepository.findByIdAndUserId(id, userId).orElse(null);
        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Event not found");
        }

        eventRepository.delete(event);
        return ResponseEntity.noContent().build();
    }

    // --- DTO & REQUEST Classes ---

    public static class EventDto {
        private UUID id;
        private String title;
        private String description;
        
        @JsonProperty("starts_at")
        private Instant startsAt;

        @JsonProperty("ends_at")
        private Instant endsAt;
        
        private String color;

        public EventDto(Event event) {
            this.id = event.getId();
            this.title = event.getTitle();
            this.description = event.getDescription();
            this.startsAt = event.getStartsAt();
            this.endsAt = event.getEndsAt();
            this.color = event.getColor();
        }

        public UUID getId() { return id; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public Instant getStartsAt() { return startsAt; }
        public Instant getEndsAt() { return endsAt; }
        public String getColor() { return color; }
    }

    public static class EventRequest {
        private String title;
        private String description;

        @JsonProperty("starts_at")
        private Instant startsAt;

        @JsonProperty("ends_at")
        private Instant endsAt;

        private String color;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public Instant getStartsAt() { return startsAt; }
        public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
        public Instant getEndsAt() { return endsAt; }
        public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }
}
