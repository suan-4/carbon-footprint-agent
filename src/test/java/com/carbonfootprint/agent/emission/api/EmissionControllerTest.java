package com.carbonfootprint.agent.emission.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EmissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnEmissionCalculationResult() throws Exception {
        String requestBody = """
                {
                  "activities": [
                    { "category": "transport", "activityType": "driving", "amount": 10 },
                    { "category": "diet", "activityType": "meat", "amount": 2 }
                  ]
                }
                """;

        mockMvc.perform(post("/api/emissions/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmission").value(16.1))
                .andExpect(jsonPath("$.unit").value("kgCO2e"))
                .andExpect(jsonPath("$.details[0].emission").value(2.1))
                .andExpect(jsonPath("$.details[1].emission").value(14.0));
    }

    @Test
    void shouldRejectInvalidRequest() throws Exception {
        String requestBody = """
                {
                  "activities": []
                }
                """;

        mockMvc.perform(post("/api/emissions/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation failed"));
    }
}
