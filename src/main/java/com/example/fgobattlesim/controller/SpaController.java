package com.example.fgobattlesim.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards browser routes to the React application shell.
 *
 * <p>Without this controller, navigating directly to /party in the browser
 * would make Spring look for a server route and fail before React loads.</p>
 */
@Controller
public class SpaController {

    /**
     * Sends supported SPA routes to the same static index page.
     */
    @GetMapping({"/", "/servants", "/party", "/servants/{id}"})
    public String index() {
        return "forward:/index.html";
    }
}
