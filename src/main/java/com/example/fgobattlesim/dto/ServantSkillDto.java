package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Servant skill model.
 *
 * <p>Each skill has a visible name/number and a list of function blocks that
 * describe what the skill actually does.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantSkillDto(
        Long id,
        Integer num,
        String name,
        List<ServantFunctionDto> functions
) {
}
