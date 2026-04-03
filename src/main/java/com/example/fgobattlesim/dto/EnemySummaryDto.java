package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Small enemy summary used for enemy dropdown options.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EnemySummaryDto(
        Long id,
        String name,
        String className
) {
}
