package com.example.fgobattlesim.client;

import com.example.fgobattlesim.dto.CraftEssenceDetailDto;
import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.EnemyDetailDto;
import com.example.fgobattlesim.dto.EnemySummaryDto;
import com.example.fgobattlesim.dto.MysticCodeSummaryDto;
import com.example.fgobattlesim.dto.NoblePhantasmDetailDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Low-level Atlas Academy HTTP client.
 *
 * <p>This class is intentionally focused only on external API communication.
 * It does not sort data, build UI structures, or make presentation decisions.</p>
 */
@Component
public class FgoApiClient {

    private static final String BASIC_SERVANT_ENDPOINT = "/export/NA/basic_servant.json";
    private static final String SERVANT_DETAIL_ENDPOINT = "/nice/NA/servant/{id}";
    private static final String BASIC_CRAFT_ESSENCE_ENDPOINT = "/export/NA/basic_equip.json";
    private static final String CRAFT_ESSENCE_DETAIL_ENDPOINT = "/nice/NA/equip/{id}";
    private static final String NOBLE_PHANTASM_DETAIL_ENDPOINT = "/nice/NA/NP/{id}";
    private static final String SKILL_DETAIL_ENDPOINT = "/nice/NA/skill/{id}";
    private static final String BASIC_ENEMY_ENDPOINT = "/export/NA/basic_enemy.json";
    private static final String ENEMY_DETAIL_ENDPOINT = "/nice/NA/enemy/{id}";
    private static final String BASIC_MYSTIC_CODE_ENDPOINT = "/export/NA/basic_mystic_code.json";

    private final RestClient restClient;

    public FgoApiClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public List<ServantSummaryDto> fetchServants() {
        try {
            List<ServantSummaryDto> servants = restClient.get().uri(BASIC_SERVANT_ENDPOINT).retrieve().body(new ParameterizedTypeReference<>() {});
            return servants == null ? List.of() : servants;
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch servant list from Atlas Academy API", ex);
        }
    }

    public List<CraftEssenceSummaryDto> fetchCraftEssences() {
        try {
            List<CraftEssenceSummaryDto> craftEssences = restClient.get().uri(BASIC_CRAFT_ESSENCE_ENDPOINT).retrieve().body(new ParameterizedTypeReference<>() {});
            return craftEssences == null ? List.of() : craftEssences;
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch craft essence list from Atlas Academy API", ex);
        }
    }

    public List<EnemySummaryDto> fetchEnemies() {
        try {
            List<EnemySummaryDto> enemies = restClient.get().uri(BASIC_ENEMY_ENDPOINT).retrieve().body(new ParameterizedTypeReference<>() {});
            return enemies == null ? List.of() : enemies;
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch enemy list from Atlas Academy API", ex);
        }
    }

    public List<MysticCodeSummaryDto> fetchMysticCodes() {
        try {
            List<MysticCodeSummaryDto> mysticCodes = restClient.get().uri(BASIC_MYSTIC_CODE_ENDPOINT).retrieve().body(new ParameterizedTypeReference<>() {});
            return mysticCodes == null ? List.of() : mysticCodes;
        } catch (RestClientException ex) {
            // Keep app usable in case Atlas changes this export endpoint.
            return List.of();
        }
    }

    public CraftEssenceDetailDto fetchCraftEssenceById(Long id) {
        try {
            return restClient.get().uri(CRAFT_ESSENCE_DETAIL_ENDPOINT, id).retrieve().body(CraftEssenceDetailDto.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch craft essence details from Atlas Academy API", ex);
        }
    }

    public NoblePhantasmDetailDto fetchNoblePhantasmById(Long id) {
        try {
            return restClient.get().uri(NOBLE_PHANTASM_DETAIL_ENDPOINT, id).retrieve().body(NoblePhantasmDetailDto.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch noble phantasm details from Atlas Academy API", ex);
        }
    }

    public JsonNode fetchSkillById(Long id) {
        try {
            return restClient.get().uri(SKILL_DETAIL_ENDPOINT, id).retrieve().body(JsonNode.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch skill details from Atlas Academy API", ex);
        }
    }

    public EnemyDetailDto fetchEnemyById(Long id) {
        try {
            return restClient.get().uri(ENEMY_DETAIL_ENDPOINT, id).retrieve().body(EnemyDetailDto.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch enemy details from Atlas Academy API", ex);
        }
    }

    public ServantDetailDto fetchServantById(Long id) {
        try {
            return restClient.get().uri(SERVANT_DETAIL_ENDPOINT, id).retrieve().body(ServantDetailDto.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch servant details from Atlas Academy API", ex);
        }
    }
}
