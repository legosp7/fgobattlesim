package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantDetailDto(
        Long id,
        String name,
        Integer rarity,
        String className,
        Integer atkMax,
        Integer hpMax,
        List<ServantSkillDto> skills,
        List<NoblePhantasmDto> noblePhantasms
) {
}
