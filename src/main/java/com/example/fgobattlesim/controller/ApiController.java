package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.service.FgoApiService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final FgoApiService service;

    public ApiController(FgoApiService service) {
        this.service = service;
    }

    @GetMapping("/servants")
    public List<ServantSummaryDto> servants() {
        return service.getAllServants();
    }

    @GetMapping("/servants/{id}")
    public ServantDetailDto servant(@PathVariable Long id) {
        return service.getServant(id);
    }

    @GetMapping("/craft-essences")
    public List<CraftEssenceSummaryDto> craftEssences() {
        return service.getAllCraftEssences();
    }
}
