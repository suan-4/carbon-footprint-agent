package com.carbonfootprint.agent.emission.api;

import com.carbonfootprint.agent.emission.model.EmissionCalculationRequest;
import com.carbonfootprint.agent.emission.model.EmissionCalculationResponse;
import com.carbonfootprint.agent.emission.service.EmissionCalculationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/emissions")
public class EmissionController {

    private final EmissionCalculationService emissionCalculationService;

    public EmissionController(EmissionCalculationService emissionCalculationService) {
        this.emissionCalculationService = emissionCalculationService;
    }

    @PostMapping("/calculate")
    public EmissionCalculationResponse calculate(@Valid @RequestBody EmissionCalculationRequest request) {
        return emissionCalculationService.calculate(request);
    }
}
