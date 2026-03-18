package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantSkillDto(
        Integer num,
        String name,
        List<ServantFunctionDto> functions
) {
}
