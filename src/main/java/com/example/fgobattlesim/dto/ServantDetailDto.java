package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

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
        List<NoblePhantasmDto> noblePhantasms
) {
}
