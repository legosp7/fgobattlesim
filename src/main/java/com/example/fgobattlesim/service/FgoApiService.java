package com.example.fgobattlesim.service;

import com.example.fgobattlesim.client.FgoApiClient;
import com.example.fgobattlesim.dto.CraftEssenceDetailDto;
import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.EnemyDetailDto;
import com.example.fgobattlesim.dto.EnemySummaryDto;
import com.example.fgobattlesim.dto.MysticCodeSummaryDto;
import com.example.fgobattlesim.dto.NoblePhantasmDetailDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Service layer.
 *
 * <p>This is where we put app-specific rules that sit between the controller
 * layer and the raw HTTP client layer.</p>
 */
@Service
public class FgoApiService {

    private final FgoApiClient client;

    public FgoApiService(FgoApiClient client) {
        this.client = client;
    }

    /**
     * Returns servants filtered for usable display and sorted alphabetically.
     *
     * <p>Tutorial note: IDs beginning with 99 are NPC entities in Atlas data,
     * so we hide them from interactive selection lists.</p>
     */
    public List<ServantSummaryDto> getAllServants() {
        return client.fetchServants().stream()
                .filter(s -> s.id() != null && s.name() != null && !s.name().isBlank())
                .filter(s -> !String.valueOf(s.id()).startsWith("99"))
                .sorted(Comparator.comparing(ServantSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<CraftEssenceSummaryDto> getAllCraftEssences() {
        return client.fetchCraftEssences().stream()
                .filter(ce -> ce.id() != null && ce.name() != null && !ce.name().isBlank())
                .sorted(Comparator.comparing(CraftEssenceSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<EnemySummaryDto> getAllEnemies() {
        return client.fetchEnemies().stream()
                .filter(enemy -> enemy.id() != null && enemy.name() != null && !enemy.name().isBlank())
                .sorted(Comparator.comparing(EnemySummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<MysticCodeSummaryDto> getAllMysticCodes() {
        List<MysticCodeSummaryDto> fetched = client.fetchMysticCodes();
        if (!fetched.isEmpty()) {
            return fetched.stream()
                    .filter(mc -> mc.id() != null && mc.name() != null && !mc.name().isBlank())
                    .sorted(Comparator.comparing(MysticCodeSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                    .toList();
        }

        // Friendly fallback for local/offline learning if endpoint is unavailable.
        return List.of(
                new MysticCodeSummaryDto(1L, "Chaldea Combat Uniform"),
                new MysticCodeSummaryDto(2L, "Mage's Association Uniform"),
                new MysticCodeSummaryDto(3L, "Atlas Academy Uniform")
        );
    }

    public CraftEssenceDetailDto getCraftEssence(Long id) {
        return client.fetchCraftEssenceById(id);
    }

    public NoblePhantasmDetailDto getNoblePhantasm(Long id) {
        return client.fetchNoblePhantasmById(id);
    }

    public EnemyDetailDto getEnemy(Long id) {
        return client.fetchEnemyById(id);
    }

    public ServantDetailDto getServant(Long id) {
        return client.fetchServantById(id);
    }

    public JsonNode getSkill(Long id) {
        return client.fetchSkillById(id);
    }
}
