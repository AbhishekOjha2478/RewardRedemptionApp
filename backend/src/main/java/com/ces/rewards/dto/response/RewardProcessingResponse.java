package com.ces.rewards.dto.response;

public record RewardProcessingResponse(
        Long customerId,
        String customerType,
        String rateApplied,
        int transactionsProcessed,
        long pointsEarned,
        long newBalance
) {
}
