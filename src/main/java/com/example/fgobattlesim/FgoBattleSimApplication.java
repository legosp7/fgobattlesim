package com.example.fgobattlesim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Application entrypoint.
 *
 * <p>If you are new to Spring Boot, this class does two important things:</p>
 * <ul>
 *     <li>It gives Java a traditional {@code main(...)} method to start from.</li>
 *     <li>It tells Spring Boot to auto-configure the application and scan this
 *     package (and child packages) for beans such as controllers and services.</li>
 * </ul>
 */
@SpringBootApplication
public class FgoBattleSimApplication {

    /**
     * Starts the embedded Spring Boot application.
     */
    public static void main(String[] args) {
        SpringApplication.run(FgoBattleSimApplication.class, args);
    }
}
