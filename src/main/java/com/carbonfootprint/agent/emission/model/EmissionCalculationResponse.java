package com.carbonfootprint.agent.emission.model;

import java.math.BigDecimal;
import java.util.List;

public record EmissionCalculationResponse(
        BigDecimal totalEmission,
        String unit,
        List<EmissionDetail> details
) {
}
