package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.CraftEssenceDetailDto;
import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.EnemyDetailDto;
import com.example.fgobattlesim.dto.EnemySummaryDto;
import com.example.fgobattlesim.dto.MysticCodeSummaryDto;
import com.example.fgobattlesim.dto.NoblePhantasmDetailDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.service.FgoApiService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API controller used by the React front end.
 */
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

    @GetMapping("/noble-phantasms/{id}")
    public NoblePhantasmDetailDto noblePhantasm(@PathVariable Long id) {
        return service.getNoblePhantasm(id);
    }

    @GetMapping("/craft-essences/{id}")
    public CraftEssenceDetailDto craftEssence(@PathVariable Long id) {
        return service.getCraftEssence(id);
    }

    @GetMapping("/craft-essences")
    public List<CraftEssenceSummaryDto> craftEssences() {
        return service.getAllCraftEssences();
    }

    @GetMapping("/mystic-codes")
    public List<MysticCodeSummaryDto> mysticCodes() {
        return service.getAllMysticCodes();
    }

    @GetMapping("/enemies")
    public List<EnemySummaryDto> enemies() {
        return service.getAllEnemies();
    }

    @GetMapping("/enemies/{id}")
    public EnemyDetailDto enemy(@PathVariable Long id) {
        return service.getEnemy(id);
    }

    @GetMapping("/skills/{id}")
    public JsonNode skill(@PathVariable Long id) {
        return service.getSkill(id);
    }
}
