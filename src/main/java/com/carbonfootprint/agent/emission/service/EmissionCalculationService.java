package com.carbonfootprint.agent.emission.service;

import com.carbonfootprint.agent.emission.model.EmissionActivityRequest;
import com.carbonfootprint.agent.emission.model.EmissionCalculationRequest;
import com.carbonfootprint.agent.emission.model.EmissionCalculationResponse;
import com.carbonfootprint.agent.emission.model.EmissionDetail;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class EmissionCalculationService {

    private static final String UNIT = "kgCO2e";

    private final EmissionFactorRegistry emissionFactorRegistry;

    public EmissionCalculationService(EmissionFactorRegistry emissionFactorRegistry) {
        this.emissionFactorRegistry = emissionFactorRegistry;
    }

    public EmissionCalculationResponse calculate(EmissionCalculationRequest request) {
        List<EmissionDetail> details = request.activities().stream()
                .map(this::toDetail)
                .toList();

        BigDecimal totalEmission = details.stream()
                .map(EmissionDetail::emission)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new EmissionCalculationResponse(totalEmission, UNIT, details);
    }

    private EmissionDetail toDetail(EmissionActivityRequest activity) {
        BigDecimal factor = emissionFactorRegistry.findFactor(activity.activityType())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unsupported activityType: " + activity.activityType()
                ));

        BigDecimal emission = activity.amount()
                .multiply(factor)
                .setScale(2, RoundingMode.HALF_UP);

        return new EmissionDetail(
                activity.category(),
                activity.activityType(),
                activity.amount(),
                factor,
                emission
        );
    }
}
