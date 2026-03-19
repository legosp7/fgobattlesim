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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Controller
public class ServantController {

    private static final int MIN_LEVEL = 1;
    private static final int MAX_LEVEL = 120;

    private final FgoApiService service;

    public ServantController(FgoApiService service) {
        this.service = service;
    }

    @GetMapping("/")
    public String index(@RequestParam(required = false) Long servantId,
                        @RequestParam(required = false) Integer skillIndex,
                        @RequestParam(required = false) Integer level,
                        Model model) {
        model.addAttribute("servants", service.getAllServants());
        model.addAttribute("selectedServantId", servantId);

        if (servantId != null) {
            ServantDetailDto servant = service.getServant(servantId);
            addServantViewData(model, servant, skillIndex, level);
        }

        return "index";
    }

    @GetMapping("/servants/{id}")
    public String servantDetails(@PathVariable Long id,
                                 @RequestParam(required = false) Integer skillIndex,
                                 @RequestParam(required = false) Integer level,
                                 Model model) {
        ServantDetailDto servant = service.getServant(id);
        addServantViewData(model, servant, skillIndex, level);
        return "servant";
    }

    private void addServantViewData(Model model,
                                    ServantDetailDto servant,
                                    Integer requestedSkillIndex,
                                    Integer requestedLevel) {
        model.addAttribute("servant", servant);
        model.addAttribute("noblePhantasmName", firstNpName(servant));
        model.addAttribute("noblePhantasmSummaries", buildNpSummaries(servant.noblePhantasms()));

        int selectedLevel = resolveSelectedLevel(requestedLevel);
        model.addAttribute("levelOptions", IntStream.rangeClosed(MIN_LEVEL, MAX_LEVEL).boxed().toList());
        model.addAttribute("selectedLevel", selectedLevel);
        model.addAttribute("displayedAtk", resolveStatForLevel(selectedLevel, servant.atkGrowth(), servant.atkBase(), servant.atkMax(), servant.lvMax()));
        model.addAttribute("displayedHp", resolveStatForLevel(selectedLevel, servant.hpGrowth(), servant.hpBase(), servant.hpMax(), servant.lvMax()));

        List<SkillOption> skillOptions = buildSkillOptions(servant.skills());
        int selectedSkillIndex = resolveSelectedSkillIndex(requestedSkillIndex, skillOptions.size());
        model.addAttribute("skillOptions", skillOptions);
        model.addAttribute("selectedSkillIndex", selectedSkillIndex);
        model.addAttribute("selectedSkillTable", buildSelectedSkillTable(servant.skills(), selectedSkillIndex));
    }

    private int resolveSelectedSkillIndex(Integer requestedSkillIndex, int skillCount) {
        if (skillCount == 0) {
            return -1;
        }
        if (requestedSkillIndex == null || requestedSkillIndex < 0 || requestedSkillIndex >= skillCount) {
            return 0;
        }
        return requestedSkillIndex;
    }

    private int resolveSelectedLevel(Integer requestedLevel) {
        if (requestedLevel == null) {
            return MIN_LEVEL;
        }
        return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, requestedLevel));
    }

    private int resolveStatForLevel(int level,
                                    List<Integer> growthValues,
                                    Integer baseStat,
                                    Integer maxStat,
                                    Integer lvMax) {
        if (growthValues != null && !growthValues.isEmpty()) {
            int index = Math.max(0, Math.min(level - 1, growthValues.size() - 1));
            Integer growthValue = growthValues.get(index);
            if (growthValue != null) {
                return growthValue;
            }
        }

        int safeBase = baseStat == null ? 0 : baseStat;
        int safeMax = maxStat == null ? safeBase : maxStat;
        int safeLvMax = lvMax == null || lvMax < 1 ? MAX_LEVEL : Math.min(MAX_LEVEL, lvMax);

        if (level <= 1) {
            return safeBase;
        }
        if (level >= safeLvMax) {
            return safeMax;
        }

        BigDecimal progress = BigDecimal.valueOf(level - 1L)
                .divide(BigDecimal.valueOf(Math.max(1, safeLvMax - 1L)), 6, RoundingMode.HALF_UP);
        BigDecimal interpolated = BigDecimal.valueOf(safeBase)
                .add(BigDecimal.valueOf(safeMax - safeBase).multiply(progress));
        return interpolated.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private String firstNpName(ServantDetailDto servant) {
        if (servant.noblePhantasms() == null || servant.noblePhantasms().isEmpty()) {
            return "Unknown";
        }

        NoblePhantasmDto np = servant.noblePhantasms().get(0);
        return np.name() == null || np.name().isBlank() ? "Unknown" : np.name();
    }

    private List<SkillOption> buildSkillOptions(List<ServantSkillDto> skills) {
        if (skills == null || skills.isEmpty()) {
            return List.of();
        }

        return IntStream.range(0, skills.size())
                .mapToObj(index -> {
                    ServantSkillDto skill = skills.get(index);
                    String label = "Skill " + (skill.num() == null ? index + 1 : skill.num()) + " - " + safeName(skill.name());
                    return new SkillOption(index, label);
                })
                .toList();
    }

    private SkillTable buildSelectedSkillTable(List<ServantSkillDto> skills, int selectedSkillIndex) {
        if (skills == null || skills.isEmpty() || selectedSkillIndex < 0 || selectedSkillIndex >= skills.size()) {
            return new SkillTable("No skill selected", List.of(), List.of());
        }

        ServantSkillDto skill = skills.get(selectedSkillIndex);
        List<LevelRow> rows = buildSkillLevelRows(skill.functions());
        List<String> columns = collectColumns(rows);
        return new SkillTable(
                "Skill " + (skill.num() == null ? selectedSkillIndex + 1 : skill.num()) + " - " + safeName(skill.name()),
                columns,
                rows
        );
    }

    private List<LevelRow> buildSkillLevelRows(List<ServantFunctionDto> functions) {
        if (functions == null || functions.isEmpty()) {
            return List.of();
        }

        int levelCount = functions.stream()
                .mapToInt(this::inferLevelCount)
                .max()
                .orElse(0);

        if (levelCount == 0) {
            return List.of();
        }

        List<LevelRow> rows = new ArrayList<>();
        for (int level = 0; level < levelCount; level++) {
            Map<String, String> values = new LinkedHashMap<>();
            for (ServantFunctionDto function : functions) {
                extractLevelValues(function, level).forEach(values::putIfAbsent);
            }
            rows.add(new LevelRow(level + 1, values));
        }
        return rows;
    }

    private int inferLevelCount(ServantFunctionDto function) {
        return Stream.of(function.svals(), function.svals2(), function.svals3(), function.svals4(), function.svals5())
                .filter(Objects::nonNull)
                .mapToInt(List::size)
                .max()
                .orElse(0);
    }

    private Map<String, String> extractLevelValues(ServantFunctionDto function, int levelIndex) {
        Map<String, String> values = new LinkedHashMap<>();
        List<List<Map<String, Object>>> groups = List.of(
                emptyIfNull(function.svals()),
                emptyIfNull(function.svals2()),
                emptyIfNull(function.svals3()),
                emptyIfNull(function.svals4()),
                emptyIfNull(function.svals5())
        );

        for (List<Map<String, Object>> group : groups) {
            if (levelIndex >= group.size()) {
                continue;
            }

            Map<String, Object> sval = group.get(levelIndex);
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

                String label = readableKey(function.funcType(), key);
                values.putIfAbsent(label, formatValue(normalized, number));
            }
        }
        return values;
    }

    private List<Map<String, Object>> emptyIfNull(List<Map<String, Object>> group) {
        return group == null ? List.of() : group;
    }

    private List<String> collectColumns(List<LevelRow> rows) {
        LinkedHashMap<String, Boolean> ordered = new LinkedHashMap<>();
        for (LevelRow row : rows) {
            row.values().keySet().forEach(key -> ordered.putIfAbsent(key, Boolean.TRUE));
        }
        return new ArrayList<>(ordered.keySet());
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
            Map<String, String> extracted = summarizeRepresentativeValues(function);
            String funcName = function.funcType() == null ? "Effect" : function.funcType();

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

    private Map<String, String> summarizeRepresentativeValues(ServantFunctionDto function) {
        Map<String, String> firstLevel = extractLevelValues(function, 0);
        if (!firstLevel.isEmpty()) {
            return firstLevel;
        }

        int levelCount = inferLevelCount(function);
        for (int level = 1; level < levelCount; level++) {
            Map<String, String> extracted = extractLevelValues(function, level);
            if (!extracted.isEmpty()) {
                return extracted;
            }
        }
        return Map.of();
    }

    private boolean isUsefulNumericKey(String key) {
        return key.contains("rate")
                || key.contains("value")
                || key.contains("up")
                || key.contains("damage")
                || key.contains("turn")
                || key.contains("count")
                || key.contains("chance")
                || key.contains("percent");
    }

    private String readableKey(String funcType, String key) {
        String prefix = funcType == null || funcType.isBlank() ? "Effect" : humanize(funcType);
        return prefix + " - " + humanize(key);
    }

    private String humanize(String input) {
        String withSpaces = input
                .replaceAll("([a-z])([A-Z])", "$1 $2")
                .replace('_', ' ')
                .trim();
        if (withSpaces.isEmpty()) {
            return "Value";
        }
        return Stream.of(withSpaces.split("\\s+"))
                .map(part -> part.isEmpty() ? part : part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1))
                .collect(Collectors.joining(" "));
    }

    private String formatValue(String key, Number number) {
        BigDecimal decimal = BigDecimal.valueOf(number.doubleValue()).stripTrailingZeros();
        String formatted = decimal.toPlainString();
        if (key.contains("rate") || key.contains("chance") || key.endsWith("up") || key.contains("percent")) {
            return formatted + "%";
        }
        return formatted;
    }

    private String safeName(String value) {
        return value == null || value.isBlank() ? "Unknown" : value;
    }

    public record SkillOption(int index, String label) {
    }

    public record SkillTable(String title, List<String> columns, List<LevelRow> rows) {
    }

    public record LevelRow(int level, Map<String, String> values) {
    }
}
