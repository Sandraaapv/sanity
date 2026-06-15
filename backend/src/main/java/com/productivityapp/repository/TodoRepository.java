package com.productivityapp.repository;
import com.productivityapp.entity.Todo;
import com.productivityapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Long> {
    List<Todo> findByUser(User user);
}