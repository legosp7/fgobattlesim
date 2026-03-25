package com.example.fgobattlesim.service;

import com.example.fgobattlesim.client.FgoApiClient;
import com.example.fgobattlesim.dto.CraftEssenceDetailDto;
import com.example.fgobattlesim.dto.CraftEssenceSummaryDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
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
     */
    public List<ServantSummaryDto> getAllServants() {
        return client.fetchServants().stream()
                .filter(s -> s.id() != null && s.name() != null && !s.name().isBlank())
                .sorted(Comparator.comparing(ServantSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    /**
     * Returns craft essences filtered for usable display and sorted alphabetically.
     */
    public List<CraftEssenceSummaryDto> getAllCraftEssences() {
        return client.fetchCraftEssences().stream()
                .filter(ce -> ce.id() != null && ce.name() != null && !ce.name().isBlank())
                .sorted(Comparator.comparing(CraftEssenceSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    /**
     * Returns full detail for a single craft essence.
     */
    public CraftEssenceDetailDto getCraftEssence(Long id) {
        return client.fetchCraftEssenceById(id);
    }

    /**
     * Returns full detail for a single servant.
     */
    public ServantDetailDto getServant(Long id) {
        return client.fetchServantById(id);
    }
}
