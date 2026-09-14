package com.ces.rewards.dto.response;

public record RewardSummaryResponse(
        Long customerId,
        String customerType,
        String rateApplied,
        long rewardPoints,
        long unprocessedTransactions
) {
}
