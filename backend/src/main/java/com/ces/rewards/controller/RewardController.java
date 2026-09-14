package com.ces.rewards.controller;

import com.ces.rewards.dto.response.RewardProcessingResponse;
import com.ces.rewards.dto.response.RewardSummaryResponse;
import com.ces.rewards.service.RewardProcessingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers/{customerId}/rewards")
public class RewardController {

    private final RewardProcessingService rewardProcessingService;

    public RewardController(RewardProcessingService rewardProcessingService) {
        this.rewardProcessingService = rewardProcessingService;
    }

    @GetMapping("/summary")
    public RewardSummaryResponse summary(@PathVariable Long customerId) {
        return rewardProcessingService.summaryFor(customerId);
    }

    @PostMapping("/process")
    public RewardProcessingResponse process(@PathVariable Long customerId) {
        return rewardProcessingService.processForCustomer(customerId);
    }
}
