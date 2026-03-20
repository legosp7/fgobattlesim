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

@Component
public class FgoApiClient {

    private static final String BASIC_SERVANT_ENDPOINT = "/export/NA/basic_servant.json";
    private static final String SERVANT_DETAIL_ENDPOINT = "/nice/NA/servant/{id}";
    private static final String BASIC_CRAFT_ESSENCE_ENDPOINT = "/export/NA/basic_equip.json";

    private final RestClient restClient;

    public FgoApiClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public List<ServantSummaryDto> fetchServants() {
        try {
            List<ServantSummaryDto> servants = restClient.get()
                    .uri(BASIC_SERVANT_ENDPOINT)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            return servants == null ? List.of() : servants;
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch servant list from Atlas Academy API", ex);
        }
    }

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

    public ServantDetailDto fetchServantById(Long id) {
        try {
            return restClient.get()
                    .uri(SERVANT_DETAIL_ENDPOINT, id)
                    .retrieve()
                    .body(ServantDetailDto.class);
        } catch (RestClientException ex) {
            throw new ExternalApiException("Could not fetch servant details from Atlas Academy API", ex);
        }
    }
}
