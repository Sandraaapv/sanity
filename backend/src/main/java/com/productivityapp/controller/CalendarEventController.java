package com.productivityapp.controller;
import com.productivityapp.dto.CalendarEventDto;
import com.productivityapp.service.CalendarEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class CalendarEventController {
    private final CalendarEventService eventService;
    public CalendarEventController(CalendarEventService eventService) { this.eventService = eventService; }

    @GetMapping
    public ResponseEntity<List<CalendarEventDto>> getAll(Principal principal) {
        return ResponseEntity.ok(eventService.getAllByUser(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<CalendarEventDto> create(@RequestBody CalendarEventDto dto, Principal principal) {
        return ResponseEntity.ok(eventService.create(principal.getName(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventDto> update(@PathVariable Long id, @RequestBody CalendarEventDto dto) {
        return ResponseEntity.ok(eventService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }
}