package com.example.fgobattlesim.service;

import com.example.fgobattlesim.client.FgoApiClient;
import com.example.fgobattlesim.dto.ServantSummaryDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit test for the service layer.
 *
 * <p>Teaching note: this test does not start Spring Boot. It tests only the
 * service class in isolation by mocking the API client.</p>
 */
@ExtendWith(MockitoExtension.class)
class FgoApiServiceTest {

    @Mock
    private FgoApiClient apiClient;

    @InjectMocks
    private FgoApiService service;

    @Test
    void getAllServants_filtersBlankNamesAndSortsAscending() {
        when(apiClient.fetchServants()).thenReturn(List.of(
                new ServantSummaryDto(3L, "zeta", 3, "Saber"),
                new ServantSummaryDto(2L, "", 4, "Lancer"),
                new ServantSummaryDto(1L, "Artoria", 5, "Saber")
        ));

        List<ServantSummaryDto> result = service.getAllServants();

        assertThat(result).extracting(ServantSummaryDto::name)
                .containsExactly("Artoria", "zeta");
    }
}
