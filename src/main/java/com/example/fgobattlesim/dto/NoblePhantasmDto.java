package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Noble Phantasm model.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record NoblePhantasmDto(
        String name,
        String card,
        List<ServantFunctionDto> functions
) {
}
