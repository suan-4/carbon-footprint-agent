package com.carbonfootprint.agent.emission.model;

import java.math.BigDecimal;

public record EmissionDetail(
        String category,
        String activityType,
        BigDecimal amount,
        BigDecimal factor,
        BigDecimal emission
) {
}
