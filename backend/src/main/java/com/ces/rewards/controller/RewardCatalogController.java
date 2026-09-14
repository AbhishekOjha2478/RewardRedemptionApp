package com.ces.rewards.controller;

import com.ces.rewards.dto.response.RewardCategoryResponse;
import com.ces.rewards.service.RewardCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
public class RewardCatalogController {

    private final RewardCatalogService rewardCatalogService;

    public RewardCatalogController(RewardCatalogService rewardCatalogService) {
        this.rewardCatalogService = rewardCatalogService;
    }

    @GetMapping("/catalog")
    public List<RewardCategoryResponse> catalog() {
        return rewardCatalogService.catalog();
    }
}
