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

/**
 * REST API controller used by the React front end.
 *
 * <p>Important beginner idea: controllers should be thin. They should mainly
 * translate HTTP requests into calls to services.</p>
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    private final FgoApiService service;

    public ApiController(FgoApiService service) {
        this.service = service;
    }

    /**
     * Endpoint for servant dropdown data.
     */
    @GetMapping("/servants")
    public List<ServantSummaryDto> servants() {
        return service.getAllServants();
    }

    /**
     * Endpoint for one servant's detailed data.
     */
    @GetMapping("/servants/{id}")
    public ServantDetailDto servant(@PathVariable Long id) {
        return service.getServant(id);
    }

    /**
     * Endpoint for craft essence dropdown data.
     */
    @GetMapping("/craft-essences")
    public List<CraftEssenceSummaryDto> craftEssences() {
        return service.getAllCraftEssences();
    }
}
