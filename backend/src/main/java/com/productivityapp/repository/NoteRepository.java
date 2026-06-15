package com.productivityapp.repository;
import com.productivityapp.entity.Note;
import com.productivityapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUser(User user);
}