package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CraftEssenceSummaryDto(
        Long id,
        String name,
        Integer rarity
) {
}
