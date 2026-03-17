package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.exception.ExternalApiException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ExternalApiException.class)
    public String handleExternalApiException(ExternalApiException ex, Model model) {
        model.addAttribute("error", ex.getMessage());
        return "error";
    }
}
