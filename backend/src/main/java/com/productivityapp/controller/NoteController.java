package com.productivityapp.controller;
import com.productivityapp.dto.NoteDto;
import com.productivityapp.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {
    private final NoteService noteService;
    public NoteController(NoteService noteService) { this.noteService = noteService; }

    @GetMapping
    public ResponseEntity<List<NoteDto>> getAll(Principal principal) {
        return ResponseEntity.ok(noteService.getAllByUser(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<NoteDto> create(@RequestBody NoteDto dto, Principal principal) {
        return ResponseEntity.ok(noteService.create(principal.getName(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteDto> update(@PathVariable Long id, @RequestBody NoteDto dto) {
        return ResponseEntity.ok(noteService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        noteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}