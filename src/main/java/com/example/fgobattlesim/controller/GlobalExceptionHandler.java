package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.exception.ExternalApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Centralized MVC-style exception handling.
 *
 * <p>This was more important in the earlier template-based version of the app,
 * but it still demonstrates a useful Spring concept: keep cross-cutting error
 * handling in one place instead of duplicating try/catch in controllers.</p>
 */

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ExternalApiException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public Map<String, String> handleExternalApiException(ExternalApiException ex) {
        return Map.of("message", ex.getMessage());
    }
}
