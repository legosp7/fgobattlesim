package com.example.fgobattlesim.exception;

/**
 * Custom exception used when Atlas Academy calls fail.
 *
 * <p>Creating a custom exception helps us separate "our app has a bug" from
 * "the external API could not be reached or parsed."</p>
 */
public class ExternalApiException extends RuntimeException {

    /**
     * Convenience constructor for cases where we only have a human-readable message.
     *
     * <p>This keeps call sites simple in tests and in production code paths where
     * there is no lower-level exception to wrap.</p>
     *
     * @param message explanation of what failed when calling the external API
     */
    public ExternalApiException(String message) {
        super(message);
    }

    /**
     * Constructor used when we want to preserve the original throwable as a cause.
     *
     * @param message explanation of what failed when calling the external API
     * @param cause root exception that triggered this external API failure
     */
    public ExternalApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
