package com.example.fgobattlesim.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards browser routes to the React application shell.
 */
@Controller
public class SpaController {

    @GetMapping({"/", "/servants", "/party", "/enemies", "/servants/{id}"})
    public String index() {
        return "forward:/index.html";
    }
}
