package com.carbonfootprint.agent.emission.service;

import com.carbonfootprint.agent.emission.model.EmissionActivityRequest;
import com.carbonfootprint.agent.emission.model.EmissionCalculationRequest;
import com.carbonfootprint.agent.emission.model.EmissionCalculationResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmissionCalculationServiceTest {

    private final EmissionCalculationService service =
            new EmissionCalculationService(new EmissionFactorRegistry());

    @Test
    void shouldCalculateTotalEmissionFromMultipleActivities() {
        EmissionCalculationRequest request = new EmissionCalculationRequest(List.of(
                new EmissionActivityRequest("transport", "driving", new BigDecimal("12.5")),
                new EmissionActivityRequest("energy", "electricity", new BigDecimal("8"))
        ));

        EmissionCalculationResponse response = service.calculate(request);

        assertThat(response.totalEmission()).isEqualByComparingTo("7.27");
        assertThat(response.unit()).isEqualTo("kgCO2e");
        assertThat(response.details()).hasSize(2);
        assertThat(response.details().get(0).emission()).isEqualByComparingTo("2.63");
        assertThat(response.details().get(1).emission()).isEqualByComparingTo("4.64");
    }

    @Test
    void shouldRejectUnsupportedActivityType() {
        EmissionCalculationRequest request = new EmissionCalculationRequest(List.of(
                new EmissionActivityRequest("transport", "rocket", new BigDecimal("1"))
        ));

        assertThatThrownBy(() -> service.calculate(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Unsupported activityType: rocket");
    }
}
