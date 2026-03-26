package com.example.fgobattlesim.exception;

/**
 * Custom exception used when Atlas Academy calls fail.
 *
 * <p>Creating a custom exception helps us separate "our app has a bug" from
 * "the external API could not be reached or parsed."</p>
 */
public class ExternalApiException extends RuntimeException {

    public ExternalApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
