package com.example.fgobattlesim.service;

import com.example.fgobattlesim.client.FgoApiClient;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class FgoApiService {

    private final FgoApiClient client;

    public FgoApiService(FgoApiClient client) {
        this.client = client;
    }

    public List<ServantSummaryDto> getAllServants() {
        return client.fetchServants().stream()
                .filter(s -> s.id() != null && s.name() != null && !s.name().isBlank())
                .sorted(Comparator.comparing(ServantSummaryDto::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public ServantDetailDto getServant(Long id) {
        return client.fetchServantById(id);
    }
}
