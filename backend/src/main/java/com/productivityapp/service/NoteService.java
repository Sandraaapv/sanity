package com.productivityapp.service;

import com.productivityapp.dto.NoteDto;
import com.productivityapp.entity.*;
import com.productivityapp.repository.NoteRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoteService {
    private final NoteRepository noteRepository;
    private final UserService userService;

    public NoteService(NoteRepository noteRepository, UserService userService) {
        this.noteRepository = noteRepository;
        this.userService = userService;
    }

    public List<NoteDto> getAllByUser(String username) {
        User user = userService.getEntityByUsername(username);
        return noteRepository.findByUser(user).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public NoteDto create(String username, NoteDto dto) {
        User user = userService.getEntityByUsername(username);
        Note note = Note.builder()
                .user(user)
                .title(dto.getTitle())
                .content(dto.getContent())
                .color(dto.getColor())
                .isPinned(dto.isPinned())
                .category(dto.getCategory() != null ? dto.getCategory() : "General")
                .build();
        return mapToDto(noteRepository.save(note));
    }

    public NoteDto update(Long id, NoteDto dto) {
        Note note = noteRepository.findById(id).orElseThrow();
        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        note.setColor(dto.getColor());
        note.setPinned(dto.isPinned());
        if (dto.getCategory() != null) {
            note.setCategory(dto.getCategory());
        }
        return mapToDto(noteRepository.save(note));
    }

    public void delete(Long id) {
        noteRepository.deleteById(id);
    }

    private NoteDto mapToDto(Note n) {
        return NoteDto.builder()
                .id(n.getId()).title(n.getTitle()).content(n.getContent())
                .color(n.getColor()).isPinned(n.isPinned())
                .category(n.getCategory())
                .build();
    }
}