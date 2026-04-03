package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Mystic code summary option for the party builder selector.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MysticCodeSummaryDto(
        Long id,
        String name
) {
}
