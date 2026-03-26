package com.example.fgobattlesim.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * Represents one Atlas Academy "function" block inside a skill or Noble Phantasm.
 *
 * <p>The {@code svals}, {@code svals2}, etc. fields hold level-based effect
 * values. They are kept as generic maps here because Atlas Academy exposes many
 * possible numeric keys depending on the effect type.</p>
 */
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
