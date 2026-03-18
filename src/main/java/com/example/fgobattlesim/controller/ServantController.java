package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.NoblePhantasmDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantFunctionDto;
import com.example.fgobattlesim.dto.ServantSkillDto;
import com.example.fgobattlesim.service.FgoApiService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Controller
public class ServantController {

    private final FgoApiService service;

    public ServantController(FgoApiService service) {
        this.service = service;
    }

    @GetMapping("/")
    public String index(@RequestParam(required = false) Long servantId, Model model) {
        model.addAttribute("servants", service.getAllServants());
        model.addAttribute("selectedServantId", servantId);

        if (servantId != null) {
            ServantDetailDto servant = service.getServant(servantId);
            addServantViewData(model, servant);
        }

        return "index";
    }

    @GetMapping("/servants/{id}")
    public String servantDetails(@PathVariable Long id, Model model) {
        ServantDetailDto servant = service.getServant(id);
        addServantViewData(model, servant);
        return "servant";
    }

    private void addServantViewData(Model model, ServantDetailDto servant) {
        model.addAttribute("servant", servant);
        model.addAttribute("noblePhantasmName", firstNpName(servant));
        model.addAttribute("skillSummaries", buildSkillSummaries(servant.skills()));
        model.addAttribute("noblePhantasmSummaries", buildNpSummaries(servant.noblePhantasms()));
    }

    private String firstNpName(ServantDetailDto servant) {
        if (servant.noblePhantasms() == null || servant.noblePhantasms().isEmpty()) {
            return "Unknown";
        }

        NoblePhantasmDto np = servant.noblePhantasms().get(0);
        return np.name() == null || np.name().isBlank() ? "Unknown" : np.name();
    }

    private List<String> buildSkillSummaries(List<ServantSkillDto> skills) {
        if (skills == null || skills.isEmpty()) {
            return List.of("No skill data available.");
        }

        return skills.stream()
                .map(skill -> String.format(
                        "Skill %s - %s: %s",
                        skill.num() == null ? "?" : skill.num(),
                        safeName(skill.name()),
                        summarizeFunctions(skill.functions())
                ))
                .toList();
    }

    private List<String> buildNpSummaries(List<NoblePhantasmDto> noblePhantasms) {
        if (noblePhantasms == null || noblePhantasms.isEmpty()) {
            return List.of("No Noble Phantasm data available.");
        }

        return noblePhantasms.stream()
                .map(np -> String.format(
                        "%s (%s): %s",
                        safeName(np.name()),
                        np.card() == null ? "Unknown card" : np.card(),
                        summarizeFunctions(np.functions())
                ))
                .toList();
    }

    private String summarizeFunctions(List<ServantFunctionDto> functions) {
        if (functions == null || functions.isEmpty()) {
            return "No function values.";
        }

        List<String> pieces = new ArrayList<>();
        for (ServantFunctionDto function : functions) {
            String funcName = function.funcType() == null ? "Effect" : function.funcType();
            Map<String, String> extracted = extractUsefulNumbers(function);

            if (extracted.isEmpty()) {
                pieces.add(funcName + " (no numeric buff values found)");
                continue;
            }

            String joined = extracted.entrySet().stream()
                    .map(e -> e.getKey() + ": " + e.getValue())
                    .collect(Collectors.joining(", "));
            pieces.add(funcName + " [" + joined + "]");
        }

        return String.join(" | ", pieces);
    }

    private Map<String, String> extractUsefulNumbers(ServantFunctionDto function) {
        List<Map<String, Object>> allSvals = Stream.of(
                        function.svals(),
                        function.svals2(),
                        function.svals3(),
                        function.svals4(),
                        function.svals5())
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .toList();

        Map<String, String> result = new LinkedHashMap<>();
        for (Map<String, Object> sval : allSvals) {
            for (Map.Entry<String, Object> entry : sval.entrySet()) {
                Object rawValue = entry.getValue();
                if (!(rawValue instanceof Number number)) {
                    continue;
                }

                String key = entry.getKey();
                String normalized = key.toLowerCase(Locale.ROOT);
                if (!isUsefulNumericKey(normalized)) {
                    continue;
                }

                result.putIfAbsent(key, formatValue(normalized, number));
            }
        }

        return result;
    }

    private boolean isUsefulNumericKey(String key) {
        return key.contains("rate")
                || key.contains("value")
                || key.contains("up")
                || key.contains("damage")
                || key.contains("turn")
                || key.contains("count")
                || key.contains("chance");
    }

    private String formatValue(String key, Number number) {
        if (key.contains("rate") || key.contains("chance") || key.endsWith("up")) {
            return number + "%";
        }
        return number.toString();
    }

    private String safeName(String value) {
        return value == null || value.isBlank() ? "Unknown" : value;
    }
}
