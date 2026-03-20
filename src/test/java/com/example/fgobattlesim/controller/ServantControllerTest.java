package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.NoblePhantasmDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantFunctionDto;
import com.example.fgobattlesim.dto.ServantSkillDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.service.FgoApiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({ServantController.class, PartyController.class})
class ServantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FgoApiService service;

    @BeforeEach
    void setUp() {
        when(service.getAllCraftEssences()).thenReturn(List.of(
                new CraftEssenceSummaryDto(100L, "Kaleidoscope", 5),
                new CraftEssenceSummaryDto(101L, "Imaginary Element", 4)
        ));
    }

    @Test
    void indexRendersDropdownOptions() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(
                new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber")
        ));

        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Artoria Pendragon")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Party")));
    }

    @Test
    void indexWithServantIdShowsLevelSelectorSkillSelectorAndScaledStats() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(
                new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber")
        ));

        ServantFunctionDto charismaFn = new ServantFunctionDto(
                "atkUp",
                List.of(
                        Map.of("Rate", 10, "Turn", 3),
                        Map.of("Rate", 11, "Turn", 3),
                        Map.of("Rate", 12, "Turn", 3)
                ),
                List.of(),
                List.of(),
                List.of(),
                List.of());

        ServantFunctionDto npFn = new ServantFunctionDto(
                "damageNp",
                List.of(Map.of("Value", 600, "Rate", 20)),
                List.of(),
                List.of(),
                List.of(),
                List.of());

        when(service.getServant(1L)).thenReturn(new ServantDetailDto(
                1L,
                "Artoria Pendragon",
                5,
                "Saber",
                1854,
                2220,
                11221,
                15150,
                90,
                List.of(1854, 3000, 4200, 5400, 6600, 7800, 9000, 10000, 10800, 11221),
                List.of(2220, 3600, 5100, 6600, 8100, 9600, 11100, 12600, 14100, 15150),
                List.of(new ServantSkillDto(1, "Charisma", List.of(charismaFn))),
                List.of(new NoblePhantasmDto("Excalibur", "BUSTER", List.of(npFn)))
        ));

        mockMvc.perform(get("/").param("servantId", "1").param("skillIndex", "0").param("level", "10"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Choose servant level:")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Selected Level:</strong> <span>10</span>")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("ATK at selected level:</strong> <span>11221</span>")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("HP at selected level:</strong> <span>15150</span>")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Choose a skill:")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("12%")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Excalibur")));
    }

    @Test
    void partyPageShowsClassServantAndCraftEssenceSelectors() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(
                new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber"),
                new ServantSummaryDto(2L, "EMIYA", 4, "Archer")
        ));

        mockMvc.perform(get("/party")
                        .param("className", "Saber")
                        .param("servantId", "1")
                        .param("craftEssenceId", "100"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Party Builder")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Artoria Pendragon")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Kaleidoscope")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Add another servant to party")));
    }
}
