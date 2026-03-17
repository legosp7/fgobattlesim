package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.service.FgoApiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

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
    void indexWithServantIdShowsDetails() throws Exception {
        when(service.getAllServants()).thenReturn(List.of(
                new ServantSummaryDto(1L, "Artoria Pendragon", 5, "Saber")
        ));
        when(service.getServant(1L)).thenReturn(new ServantDetailDto(1L, "Artoria Pendragon", 5, "Saber", 11221, 15150, List.of()));

        mockMvc.perform(get("/").param("servantId", "1"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Max ATK")));
    }
}
