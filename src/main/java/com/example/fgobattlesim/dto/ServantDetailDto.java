package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantDetailDto(
        Long id,
        String name,
        Integer rarity,
        String className,
        Integer atkMax,
        Integer hpMax,
        java.util.List<NoblePhantasmDto> noblePhantasms
) {
}
