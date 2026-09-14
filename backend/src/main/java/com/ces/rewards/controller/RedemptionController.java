package com.ces.rewards.controller;

import com.ces.rewards.dto.response.PageResponse;
import com.ces.rewards.dto.response.RedemptionResponse;
import com.ces.rewards.security.AuthenticatedUser;
import com.ces.rewards.service.RedemptionService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RedemptionController {

    private final RedemptionService redemptionService;

    public RedemptionController(RedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    @PostMapping("/customers/{customerId}/redemptions")
    @ResponseStatus(HttpStatus.CREATED)
    public RedemptionResponse redeem(@PathVariable Long customerId,
                                     @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return redemptionService.redeemCart(customerId, currentUser.getUsername());
    }

    @GetMapping("/customers/{customerId}/redemptions")
    public PageResponse<RedemptionResponse> history(@PathVariable Long customerId,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return redemptionService.historyFor(customerId, pageable);
    }

    @GetMapping("/redemptions/{redemptionId}")
    public RedemptionResponse findById(@PathVariable Long redemptionId) {
        return redemptionService.findById(redemptionId);
    }
}
