package com.example.fgobattlesim.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({"/", "/party", "/servants/{id}"})
    public String index() {
        return "forward:/index.html";
    }
}
