package com.carbonfootprint.agent.emission.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@Component
public class EmissionFactorRegistry {

    private static final Map<String, BigDecimal> FACTORS = Map.of(
            "driving", new BigDecimal("0.21"),
            "bus", new BigDecimal("0.08"),
            "subway", new BigDecimal("0.04"),
            "cycling", BigDecimal.ZERO,
            "electricity", new BigDecimal("0.58"),
            "natural_gas", new BigDecimal("2.00"),
            "meat", new BigDecimal("7.00"),
            "dairy", new BigDecimal("3.20"),
            "vegetarian", new BigDecimal("2.00")
    );

    public Optional<BigDecimal> findFactor(String activityType) {
        if (activityType == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(FACTORS.get(activityType.trim().toLowerCase()));
    }
}
