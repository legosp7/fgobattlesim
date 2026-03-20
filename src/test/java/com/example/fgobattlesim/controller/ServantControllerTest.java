package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.NoblePhantasmDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantFunctionDto;
import com.example.fgobattlesim.dto.ServantSkillDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.service.FgoApiService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({ApiController.class, SpaController.class})
class ServantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FgoApiService service;

    @Test
    void spaRoutesForwardToReactEntryPoint() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<div id=\"root\"></div>")));
    }

    @Test
    void servantsApiReturnsServantSummaries() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(
                new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber")
        ));

        mockMvc.perform(get("/api/servants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Artoria Pendragon"))
                .andExpect(jsonPath("$[0].className").value("Saber"));
    }

    @Test
    void servantDetailApiReturnsGrowthSkillAndNpData() throws Exception {
        ServantFunctionDto charismaFn = new ServantFunctionDto(
                "atkUp",
                List.of(
                        Map.of("Rate", 10, "Turn", 3),
                        Map.of("Rate", 11, "Turn", 3)
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
                List.of(1854, 3000, 4200),
                List.of(2220, 3600, 5100),
                List.of(new ServantSkillDto(1, "Charisma", List.of(charismaFn))),
                List.of(new NoblePhantasmDto("Excalibur", "BUSTER", List.of(npFn)))
        ));

        mockMvc.perform(get("/api/servants/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Artoria Pendragon"))
                .andExpect(jsonPath("$.atkGrowth[1]").value(3000))
                .andExpect(jsonPath("$.skills[0].name").value("Charisma"))
                .andExpect(jsonPath("$.noblePhantasms[0].name").value("Excalibur"));
    }

    @Test
    void craftEssenceApiReturnsCraftEssenceSummaries() throws Exception {
        when(service.getAllCraftEssences()).thenReturn(List.of(
                new CraftEssenceSummaryDto(100L, "Kaleidoscope", 5)
        ));

        mockMvc.perform(get("/api/craft-essences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Kaleidoscope"));
    }
}
