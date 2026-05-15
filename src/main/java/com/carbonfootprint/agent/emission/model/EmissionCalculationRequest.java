package com.carbonfootprint.agent.emission.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record EmissionCalculationRequest(
        @NotEmpty(message = "activities must not be empty")
        List<@Valid EmissionActivityRequest> activities
) {
}
