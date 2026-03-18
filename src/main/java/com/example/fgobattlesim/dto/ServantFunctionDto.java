package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ServantFunctionDto(
        String funcType,
        List<Map<String, Object>> svals,
        List<Map<String, Object>> svals2,
        List<Map<String, Object>> svals3,
        List<Map<String, Object>> svals4,
        List<Map<String, Object>> svals5
) {
}
