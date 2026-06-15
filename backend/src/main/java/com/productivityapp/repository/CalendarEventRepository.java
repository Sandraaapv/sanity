package com.productivityapp.repository;
import com.productivityapp.entity.CalendarEvent;
import com.productivityapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByUser(User user);

    @Query("SELECT e FROM CalendarEvent e JOIN FETCH e.user u WHERE e.reminderEnabled = true AND e.reminderSent = false AND e.startTime <= :targetTime")
    List<CalendarEvent> findPendingReminders(LocalDateTime targetTime);
}