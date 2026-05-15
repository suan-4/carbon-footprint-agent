package com.carbonfootprint.agent.emission.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record EmissionActivityRequest(
        @NotBlank(message = "category is required")
        String category,
        @NotBlank(message = "activityType is required")
        String activityType,
        @DecimalMin(value = "0.0", inclusive = false, message = "amount must be greater than 0")
        BigDecimal amount
) {
}
