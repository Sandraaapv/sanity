package com.productivityapp.service;

import com.productivityapp.dto.TodoDto;
import com.productivityapp.entity.*;
import com.productivityapp.repository.TodoRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TodoService {
    private final TodoRepository todoRepository;
    private final UserService userService;

    public TodoService(TodoRepository todoRepository, UserService userService) {
        this.todoRepository = todoRepository;
        this.userService = userService;
    }

    public List<TodoDto> getAllByUser(String username) {
        User user = userService.getEntityByUsername(username);
        return todoRepository.findByUser(user).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public TodoDto create(String username, TodoDto dto) {
        User user = userService.getEntityByUsername(username);
        Todo todo = Todo.builder()
                .user(user)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .completed(dto.isCompleted())
                .priority(Priority.valueOf(dto.getPriority()))
                .dueDate(dto.getDueDate())
                .category(dto.getCategory() != null ? dto.getCategory() : "General")
                .build();
        return mapToDto(todoRepository.save(todo));
    }

    public TodoDto update(Long id, TodoDto dto) {
        Todo todo = todoRepository.findById(id).orElseThrow();
        todo.setTitle(dto.getTitle());
        todo.setDescription(dto.getDescription());
        todo.setCompleted(dto.isCompleted());
        todo.setPriority(Priority.valueOf(dto.getPriority()));
        todo.setDueDate(dto.getDueDate());
        if (dto.getCategory() != null) {
            todo.setCategory(dto.getCategory());
        }
        return mapToDto(todoRepository.save(todo));
    }

    public void delete(Long id) {
        todoRepository.deleteById(id);
    }

    private TodoDto mapToDto(Todo t) {
        return TodoDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .completed(t.isCompleted())
                .priority(t.getPriority().name())
                .dueDate(t.getDueDate())
                .category(t.getCategory())
                .build();
    }
}