package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Detailed enemy data for the encounter builder page.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EnemyDetailDto(
        Long id,
        String name,
        String className,
        Integer hpBase,
        Integer atkBase,
        List<TraitDto> traits
) {
}
