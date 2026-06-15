package com.productivityapp.service;

import com.productivityapp.dto.CalendarEventDto;
import com.productivityapp.entity.*;
import com.productivityapp.repository.CalendarEventRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarEventService {
    private final CalendarEventRepository eventRepository;
    private final UserService userService;

    public CalendarEventService(CalendarEventRepository eventRepository, UserService userService) {
        this.eventRepository = eventRepository;
        this.userService = userService;
    }

    public List<CalendarEventDto> getAllByUser(String username) {
        User user = userService.getEntityByUsername(username);
        return eventRepository.findByUser(user).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public CalendarEventDto create(String username, CalendarEventDto dto) {
        User user = userService.getEntityByUsername(username);
        CalendarEvent event = CalendarEvent.builder()
                .user(user)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .allDay(dto.isAllDay())
                .color(dto.getColor())
                .location(dto.getLocation())
                .reminderEnabled(dto.isReminderEnabled())
                .reminderMinutesBefore(dto.getReminderMinutesBefore())
                .build();
        return mapToDto(eventRepository.save(event));
    }

    public CalendarEventDto update(Long id, CalendarEventDto dto) {
        CalendarEvent event = eventRepository.findById(id).orElseThrow();
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setAllDay(dto.isAllDay());
        event.setColor(dto.getColor());
        event.setLocation(dto.getLocation());
        event.setReminderEnabled(dto.isReminderEnabled());
        event.setReminderMinutesBefore(dto.getReminderMinutesBefore());
        event.setReminderSent(false); // reset reminder lock status on modifications
        return mapToDto(eventRepository.save(event));
    }

    public void delete(Long id) {
        eventRepository.deleteById(id);
    }

    private CalendarEventDto mapToDto(CalendarEvent e) {
        return CalendarEventDto.builder()
                .id(e.getId()).title(e.getTitle()).description(e.getDescription())
                .startTime(e.getStartTime()).endTime(e.getEndTime()).allDay(e.isAllDay())
                .color(e.getColor()).location(e.getLocation()).reminderEnabled(e.isReminderEnabled())
                .reminderMinutesBefore(e.getReminderMinutesBefore())
                .build();
    }
}