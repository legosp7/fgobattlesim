package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.exception.ExternalApiException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Centralized MVC-style exception handling.
 *
 * <p>This was more important in the earlier template-based version of the app,
 * but it still demonstrates a useful Spring concept: keep cross-cutting error
 * handling in one place instead of duplicating try/catch in controllers.</p>
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Places a friendly error message in the model.
     */
    @ExceptionHandler(ExternalApiException.class)
    public String handleExternalApiException(ExternalApiException ex, Model model) {
        model.addAttribute("error", ex.getMessage());
        return "error";
    }
}
