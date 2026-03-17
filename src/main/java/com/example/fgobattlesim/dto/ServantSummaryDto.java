package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantSummaryDto(
        Long id,
        String name,
        Integer rarity,
        String className
) {
}
