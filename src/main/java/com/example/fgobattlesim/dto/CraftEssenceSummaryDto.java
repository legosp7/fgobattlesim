package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Minimal Craft Essence DTO for dropdown display.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CraftEssenceSummaryDto(
        Long id,
        String name,
        Integer rarity
) {
}
