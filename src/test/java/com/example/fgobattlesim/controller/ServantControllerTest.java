package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.CraftEssenceDetailDto;
import com.example.fgobattlesim.dto.CraftEssenceSkillDto;
import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.EnemyDetailDto;
import com.example.fgobattlesim.dto.EnemySummaryDto;
import com.example.fgobattlesim.dto.MysticCodeSummaryDto;
import com.example.fgobattlesim.dto.NoblePhantasmDetailDto;
import com.example.fgobattlesim.dto.NoblePhantasmDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantFunctionDto;
import com.example.fgobattlesim.dto.ServantSkillDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.dto.TraitDto;
import com.example.fgobattlesim.service.FgoApiService;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
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
        mockMvc.perform(get("/")).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("<div id=\"root\"></div>")));
        mockMvc.perform(get("/servants")).andExpect(status().isOk());
        mockMvc.perform(get("/party")).andExpect(status().isOk());
        mockMvc.perform(get("/enemies")).andExpect(status().isOk());
    }

    @Test
    void servantsApiReturnsServantSummaries() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber")));

        mockMvc.perform(get("/api/servants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Artoria Pendragon"));
    }

    @Test
    void servantDetailApiReturnsGrowthSkillAndNpData() throws Exception {
        ServantFunctionDto charismaFn = new ServantFunctionDto("atkUp", List.of(Map.of("Rate", 10, "Turn", 3)), List.of(), List.of(), List.of(), List.of());
        ServantFunctionDto npFn = new ServantFunctionDto("damageNp", List.of(Map.of("Value", 600, "Rate", 20)), List.of(), List.of(), List.of(), List.of());

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
                List.of(new ServantSkillDto(1001L, 1, "Charisma", "ATK up", List.of(7, 6, 5), List.of(charismaFn))),
                List.of(new ServantSkillDto(3001L, 1, "Magic Loading", "Start NP", List.of(), List.of())),
                List.of(new NoblePhantasmDto(5001L, "Excalibur", "BUSTER", List.of(npFn)))
        ));

        mockMvc.perform(get("/api/servants/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills[0].coolDown[0]").value(7))
                .andExpect(jsonPath("$.appendSkills[0].name").value("Magic Loading"))
                .andExpect(jsonPath("$.noblePhantasms[0].name").value("Excalibur"));
    }

    @Test
    void extraApisReturnData() throws Exception {
        when(service.getNoblePhantasm(5001L)).thenReturn(new NoblePhantasmDetailDto(5001L, "Excalibur", "BUSTER", List.of()));
        when(service.getCraftEssence(100L)).thenReturn(new CraftEssenceDetailDto(100L, "Kaleidoscope", 5, 0, 0, 500, 0, List.of(new CraftEssenceSkillDto("Starting NP", "Grants 80% NP gauge."))));
        when(service.getAllCraftEssences()).thenReturn(List.of(new CraftEssenceSummaryDto(100L, "Kaleidoscope", 5)));
        when(service.getAllMysticCodes()).thenReturn(List.of(new MysticCodeSummaryDto(1L, "Chaldea Combat Uniform")));
        when(service.getAllEnemies()).thenReturn(List.of(new EnemySummaryDto(2001L, "Skeleton", "Saber")));
        when(service.getEnemy(2001L)).thenReturn(new EnemyDetailDto(2001L, "Skeleton", "Saber", 1200, 300, List.of(new TraitDto(1L, "Undead"))));
        when(service.getSkill(77L)).thenReturn(JsonNodeFactory.instance.objectNode().put("id", 77).put("name", "Mind's Eye"));

        mockMvc.perform(get("/api/noble-phantasms/5001")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Excalibur"));
        mockMvc.perform(get("/api/craft-essences/100")).andExpect(status().isOk()).andExpect(jsonPath("$.atkMax").value(500));
        mockMvc.perform(get("/api/craft-essences")).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Kaleidoscope"));
        mockMvc.perform(get("/api/mystic-codes")).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Chaldea Combat Uniform"));
        mockMvc.perform(get("/api/enemies")).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Skeleton"));
        mockMvc.perform(get("/api/enemies/2001")).andExpect(status().isOk()).andExpect(jsonPath("$.traits[0].name").value("Undead"));
        mockMvc.perform(get("/api/skills/77")).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(77));
    }
}
