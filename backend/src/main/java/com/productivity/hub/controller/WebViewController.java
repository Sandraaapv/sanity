package com.productivity.hub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class WebViewController {

    @RequestMapping(value = {
        "/",
        "/{path:[^\\.]*}",
        "/**/{path:[^\\.]*}"
    })
    public String index(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api") || path.startsWith("/h2-console")) {
            return "forward:" + path;
        }
        return "forward:/index.html";
    }
}
