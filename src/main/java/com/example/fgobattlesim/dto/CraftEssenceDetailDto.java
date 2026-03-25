package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Detailed Craft Essence data used by the Party tab.
 *
 * <p>We include base/max stats and skill text so learners can see both raw stat
 * contribution and effect descriptions.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CraftEssenceDetailDto(
        Long id,
        String name,
        Integer rarity,
        Integer atkBase,
        Integer hpBase,
        Integer atkMax,
        Integer hpMax,
        List<CraftEssenceSkillDto> skills
) {
}
