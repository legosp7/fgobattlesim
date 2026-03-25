package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One skill/effect block inside a Craft Essence detail response.
 *
 * <p>We only keep human-readable fields that are useful in the UI.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CraftEssenceSkillDto(
        String name,
        String detail
) {
}
