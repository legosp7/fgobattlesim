package com.example.fgobattlesim.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Central place for HTTP client configuration.
 *
 * <p>Why use a bean here instead of new-ing a client inside the API client?</p>
 * <ul>
 *     <li>It keeps configuration in one place.</li>
 *     <li>It makes testing and future customization easier.</li>
 *     <li>It follows a common Spring Boot pattern: infrastructure objects are beans.</li>
 * </ul>
 */
@Configuration
public class HttpClientConfig {

    /**
     * Creates a reusable RestClient configured with Atlas Academy's base URL.
     */
    @Bean
    RestClient atlasAcademyRestClient(@Value("${fgo.api.base-url:https://api.atlasacademy.io}") String baseUrl) {
        return RestClient.builder()
                // Setting a base URL lets later code pass only relative paths.
                .baseUrl(baseUrl)
                .build();
    }
}
