package com.example.fgobattlesim.client;

import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import com.example.fgobattlesim.exception.ExternalApiException;
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

    private final RestClient restClient;

    public FgoApiClient(RestClient restClient) {
        this.restClient = restClient;
    }

    /**
     * Fetches servant summary data for dropdown usage.
     */
    public List<ServantSummaryDto> fetchServants() {
        try {
            List<ServantSummaryDto> servants = restClient.get()
                    .uri(BASIC_SERVANT_ENDPOINT)
                    .retrieve()
                    // ParameterizedTypeReference is needed because the response is a List<T>.
                    .body(new ParameterizedTypeReference<>() {});
            return servants == null ? List.of() : servants;
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch servant list from Atlas Academy API", ex);
        }
    }

    /**
     * Fetches craft essence summary data for dropdown usage.
     */
    public List<CraftEssenceSummaryDto> fetchCraftEssences() {
        try {
            List<CraftEssenceSummaryDto> craftEssences = restClient.get()
                    .uri(BASIC_CRAFT_ESSENCE_ENDPOINT)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            return craftEssences == null ? List.of() : craftEssences;
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch craft essence list from Atlas Academy API", ex);
        }
    }

    /**
     * Fetches one servant's detailed data.
     */
    public ServantDetailDto fetchServantById(Long id) {
        try {
            return restClient.get()
                    // {id} is expanded by Spring into the actual path value.
                    .uri(SERVANT_DETAIL_ENDPOINT, id)
                    .retrieve()
                    .body(ServantDetailDto.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch servant details from Atlas Academy API", ex);
        }
    }
}
