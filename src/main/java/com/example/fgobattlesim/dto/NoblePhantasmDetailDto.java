package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Detailed Noble Phantasm model fetched from Atlas Academy's NP endpoint.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record NoblePhantasmDetailDto(
        Long id,
        String name,
        String card,
        List<ServantFunctionDto> functions
) {
}
