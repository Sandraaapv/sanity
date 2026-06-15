package com.productivityapp.controller;
import com.productivityapp.dto.TodoDto;
import com.productivityapp.service.TodoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/todos")
public class TodoController {
    private final TodoService todoService;
    public TodoController(TodoService todoService) { this.todoService = todoService; }

    @GetMapping
    public ResponseEntity<List<TodoDto>> getAll(Principal principal) {
        return ResponseEntity.ok(todoService.getAllByUser(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<TodoDto> create(@RequestBody TodoDto dto, Principal principal) {
        return ResponseEntity.ok(todoService.create(principal.getName(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoDto> update(@PathVariable Long id, @RequestBody TodoDto dto) {
        return ResponseEntity.ok(todoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        todoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}