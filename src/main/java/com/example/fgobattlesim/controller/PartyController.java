package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.service.FgoApiService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Controller
public class PartyController {

    private final FgoApiService service;

    public PartyController(FgoApiService service) {
        this.service = service;
    }

    @GetMapping("/party")
    public String party(@RequestParam(required = false) List<String> className,
                        @RequestParam(required = false) List<Long> servantId,
                        @RequestParam(required = false) List<Long> craftEssenceId,
                        @RequestParam(defaultValue = "1") Integer slots,
                        @RequestParam(defaultValue = "false") boolean addSlot,
                        Model model) {
        List<ServantSummaryDto> allServants = service.getAllServants();
        List<CraftEssenceSummaryDto> craftEssences = service.getAllCraftEssences();
        List<String> classOptions = allServants.stream()
                .map(ServantSummaryDto::className)
                .filter(Objects::nonNull)
                .filter(name -> !name.isBlank())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        int partySize = Math.max(1, slots == null ? 1 : slots);
        if (addSlot) {
            partySize++;
        }

        List<PartySlotView> partySlots = new ArrayList<>();
        for (int index = 0; index < partySize; index++) {
            String selectedClass = valueAt(className, index);
            Long selectedServantId = valueAt(servantId, index);
            Long selectedCraftEssenceId = valueAt(craftEssenceId, index);

            List<ServantSummaryDto> availableServants = selectedClass == null || selectedClass.isBlank()
                    ? List.of()
                    : allServants.stream()
                    .filter(servant -> selectedClass.equalsIgnoreCase(servant.className()))
                    .sorted(Comparator.comparing(ServantSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                    .toList();

            partySlots.add(new PartySlotView(index, selectedClass, selectedServantId, selectedCraftEssenceId, availableServants));
        }

        model.addAttribute("partySlots", partySlots);
        model.addAttribute("classOptions", classOptions);
        model.addAttribute("craftEssences", craftEssences);
        model.addAttribute("slots", partySize);
        return "party";
    }

    private <T> T valueAt(List<T> values, int index) {
        if (values == null || index < 0 || index >= values.size()) {
            return null;
        }
        return values.get(index);
    }

    public record PartySlotView(int index,
                                String selectedClassName,
                                Long selectedServantId,
                                Long selectedCraftEssenceId,
                                List<ServantSummaryDto> availableServants) {
    }
}
