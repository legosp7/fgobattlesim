package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Small summary view of a servant returned by the Atlas Academy export endpoint.
 *
 * <p>We intentionally keep this DTO small because the front end needs only a
 * few fields to populate the servant dropdown.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantSummaryDto(
        Long id,
        String name,
        Integer rarity,
        String className
) {
}
