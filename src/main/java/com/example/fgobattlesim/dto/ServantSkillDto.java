package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Servant skill model.
 *
 * <p>We keep description and cooldown so the UI can show tutorial-friendly
 * details when a learner expands each skill block.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantSkillDto(
        Long id,
        Integer num,
        String name,
        String detail,
        List<Integer> coolDown,
        List<ServantFunctionDto> functions,
        List<ServantBuffDto> buffs
) {
}
