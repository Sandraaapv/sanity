package com.productivityapp.service;

import com.productivityapp.entity.CalendarEvent;
import com.productivityapp.repository.CalendarEventRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@EnableScheduling
public class ReminderSchedulerService {

    private final CalendarEventRepository eventRepository;
    private final JavaMailSender mailSender;

    public ReminderSchedulerService(CalendarEventRepository eventRepository, JavaMailSender mailSender) {
        this.eventRepository = eventRepository;
        this.mailSender = mailSender;
    }

    @Scheduled(fixedRate = 60000) // Runs every 60 seconds
    public void checkAndSendReminders() {
        LocalDateTime now = LocalDateTime.now();
        // Fetch items where current time is within window threshold criteria
        List<CalendarEvent> pendingEvents = eventRepository.findPendingReminders(now.plusMinutes(60));

        for (CalendarEvent event : pendingEvents) {
            LocalDateTime triggerTime = event.getStartTime().minusMinutes(event.getReminderMinutesBefore());
            if (now.isAfter(triggerTime) && event.getUser().isEmailRemindersEnabled()) {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(event.getUser().getEmail());
                    message.setSubject("Reminder: " + event.getTitle());
                    message.setText(String.format("Hello %s,\n\nThis is a notification for your upcoming event:\nTitle: %s\nTime: %s\nLocation: %s\nDescription: %s",
                            event.getUser().getDisplayName(), event.getTitle(), event.getStartTime(), event.getLocation(), event.getDescription()));
                    mailSender.send(message);
                } catch (Exception e) {
                    System.err.println("Failed to send mail: " + e.getMessage());
                }
                event.setReminderSent(true);
                eventRepository.save(event);
            }
        }
    }
}