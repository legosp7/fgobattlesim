package com.example.fgobattlesim.controller;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ServantController.class)
class ServantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FgoApiService service;

    @Test
    void indexRendersDropdownOptions() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(
                new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber")
        ));

        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Artoria Pendragon")));
    }

    @Test
    void indexWithServantIdShowsSkillAndNpData() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(
                new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber")
        ));

        ServantFunctionDto skillFn = new ServantFunctionDto(
                "gainStar",
                List.of(Map.of("Rate", 30, "Turn", 3)),
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
                11221,
                15150,
                List.of(new ServantSkillDto(1, "Charisma", List.of(skillFn))),
                List.of(new NoblePhantasmDto("Excalibur", "BUSTER", List.of(npFn)))
        ));

        mockMvc.perform(get("/").param("servantId", "1"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Skill 1 - Charisma")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Excalibur")));
    }
}
