package com.productivity.hub.controller;

import com.productivity.hub.model.Note;
import com.productivity.hub.model.User;
import com.productivity.hub.repository.NoteRepository;
import com.productivity.hub.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    public NoteController(NoteRepository noteRepository, UserRepository userRepository) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<NoteDto>> getNotes(@AuthenticationPrincipal UUID userId) {
        List<Note> notes = noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<NoteDto> dtos = notes.stream()
                .map(NoteDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> createNote(@AuthenticationPrincipal UUID userId, @RequestBody NoteRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        Note note = new Note();
        note.setUser(user);
        note.setTitle(request.getTitle() != null ? request.getTitle().trim() : "Untitled");
        note.setContent(request.getContent() != null ? request.getContent() : "");
        note.setColor(request.getColor() != null ? request.getColor() : "oklch(0.16 0.005 264)");
        note.setPinned(request.getPinned() != null && request.getPinned());

        Note saved = noteRepository.save(note);
        return ResponseEntity.status(HttpStatus.CREATED).body(new NoteDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@AuthenticationPrincipal UUID userId,
                                        @PathVariable UUID id,
                                        @RequestBody NoteRequest request) {
        Note note = noteRepository.findByIdAndUserId(id, userId).orElse(null);
        if (note == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note not found");
        }

        if (request.getTitle() != null) {
            note.setTitle(request.getTitle().trim());
        }
        if (request.getContent() != null) {
            note.setContent(request.getContent());
        }
        if (request.getColor() != null) {
            note.setColor(request.getColor());
        }
        if (request.getPinned() != null) {
            note.setPinned(request.getPinned());
        }

        Note updated = noteRepository.save(note);
        return ResponseEntity.ok(new NoteDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        Note note = noteRepository.findByIdAndUserId(id, userId).orElse(null);
        if (note == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note not found");
        }

        noteRepository.delete(note);
        return ResponseEntity.noContent().build();
    }

    // --- DTO & REQUEST Classes ---

    public static class NoteDto {
        private UUID id;
        private String title;
        private String content;
        private String color;
        private boolean pinned;

        public NoteDto(Note note) {
            this.id = note.getId();
            this.title = note.getTitle();
            this.content = note.getContent();
            this.color = note.getColor();
            this.pinned = note.isPinned();
        }

        public UUID getId() { return id; }
        public String getTitle() { return title; }
        public String getContent() { return content; }
        public String getColor() { return color; }
        public boolean isPinned() { return pinned; }
    }

    public static class NoteRequest {
        private String title;
        private String content;
        private String color;
        private Boolean pinned;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public Boolean getPinned() { return pinned; }
        public void setPinned(Boolean pinned) { this.pinned = pinned; }
    }
}
