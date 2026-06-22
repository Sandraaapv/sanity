package com.productivity.hub.controller;

import com.productivity.hub.model.StudySubject;
import com.productivity.hub.model.StudySession;
import com.productivity.hub.model.User;
import com.productivity.hub.repository.StudySubjectRepository;
import com.productivity.hub.repository.StudySessionRepository;
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
@RequestMapping("/api/study")
public class StudyController {

    private final StudySubjectRepository subjectRepository;
    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;

    public StudyController(StudySubjectRepository subjectRepository,
                           StudySessionRepository sessionRepository,
                           UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    // --- SUBJECTS API ---

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectDto>> getSubjects(@AuthenticationPrincipal UUID userId) {
        List<StudySubject> subjects = subjectRepository.findByUserId(userId);
        return ResponseEntity.ok(subjects.stream().map(SubjectDto::new).collect(Collectors.toList()));
    }

    @PostMapping("/subjects")
    public ResponseEntity<?> createSubject(@AuthenticationPrincipal UUID userId, @RequestBody SubjectRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Subject name is required");
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        StudySubject subject = new StudySubject();
        subject.setUser(user);
        subject.setName(request.getName().trim());
        subject.setColor(request.getColor() != null ? request.getColor() : "#c4b5fd");

        StudySubject saved = subjectRepository.save(subject);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SubjectDto(saved));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<?> deleteSubject(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        StudySubject subject = subjectRepository.findByIdAndUserId(id, userId).orElse(null);
        if (subject == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Subject not found");
        }
        subjectRepository.delete(subject);
        return ResponseEntity.ok().build();
    }

    // --- SESSIONS API ---

    @GetMapping("/sessions")
    public ResponseEntity<List<SessionDto>> getSessions(@AuthenticationPrincipal UUID userId) {
        List<StudySession> sessions = sessionRepository.findByUserId(userId);
        return ResponseEntity.ok(sessions.stream().map(SessionDto::new).collect(Collectors.toList()));
    }

    @PostMapping("/sessions")
    public ResponseEntity<?> createSession(@AuthenticationPrincipal UUID userId, @RequestBody SessionRequest request) {
        if (request.getSubjectId() == null) {
            return ResponseEntity.badRequest().body("Subject ID is required");
        }
        if (request.getDurationSeconds() <= 0) {
            return ResponseEntity.badRequest().body("Duration must be greater than 0");
        }

        User user = userRepository.findById(userId).orElse(null);
        StudySubject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId).orElse(null);

        if (user == null || subject == null) {
            return ResponseEntity.badRequest().body("Invalid user or subject");
        }

        StudySession session = new StudySession();
        session.setUser(user);
        session.setSubject(subject);
        session.setDurationSeconds(request.getDurationSeconds());
        if (request.getStartTime() != null) {
            session.setStartTime(request.getStartTime());
        } else {
            session.setStartTime(Instant.now());
        }

        StudySession saved = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SessionDto(saved));
    }

    // --- DTO & REQUEST CLASSES ---

    public static class SubjectDto {
        private UUID id;
        private String name;
        private String color;

        public SubjectDto(StudySubject s) {
            this.id = s.getId();
            this.name = s.getName();
            this.color = s.getColor();
        }

        public UUID getId() { return id; }
        public String getName() { return name; }
        public String getColor() { return color; }
    }

    public static class SubjectRequest {
        private String name;
        private String color;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public static class SessionDto {
        private UUID id;
        private UUID subjectId;
        private String subjectName;
        private int durationSeconds;
        private Instant startTime;

        public SessionDto(StudySession s) {
            this.id = s.getId();
            this.subjectId = s.getSubject().getId();
            this.subjectName = s.getSubject().getName();
            this.durationSeconds = s.getDurationSeconds();
            this.startTime = s.getStartTime();
        }

        public UUID getId() { return id; }
        public UUID getSubjectId() { return subjectId; }
        public String getSubjectName() { return subjectName; }
        public int getDurationSeconds() { return durationSeconds; }
        public Instant getStartTime() { return startTime; }
    }

    public static class SessionRequest {
        private UUID subjectId;
        private int durationSeconds;
        private Instant startTime;

        public UUID getSubjectId() { return subjectId; }
        public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
        public int getDurationSeconds() { return durationSeconds; }
        public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
        public Instant getStartTime() { return startTime; }
        public void setStartTime(Instant startTime) { this.startTime = startTime; }
    }
}
