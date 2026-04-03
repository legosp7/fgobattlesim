package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Trait snippet used by servant/enemy detail payloads.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TraitDto(
        Long id,
        String name
) {
}
