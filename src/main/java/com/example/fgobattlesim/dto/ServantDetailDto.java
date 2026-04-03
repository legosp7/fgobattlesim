package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Full servant detail model used by the React front end.
 *
 * <p>Why include both base/max stats and growth arrays?</p>
 * <ul>
 *     <li>The growth arrays are the most accurate source when they exist.</li>
 *     <li>The base/max stats let the front end fall back to interpolation if
 *     needed.</li>
 * </ul>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantDetailDto(
        Long id,
        String name,
        Integer rarity,
        String className,
        Integer atkBase,
        Integer hpBase,
        Integer atkMax,
        Integer hpMax,
        Integer lvMax,
        List<Integer> atkGrowth,
        List<Integer> hpGrowth,
        List<ServantSkillDto> skills,
        @JsonProperty("appendPassive") List<ServantSkillDto> appendSkills,
        List<NoblePhantasmDto> noblePhantasms
) {
}
