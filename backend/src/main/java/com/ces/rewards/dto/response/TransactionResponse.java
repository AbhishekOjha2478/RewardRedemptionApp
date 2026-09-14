package com.ces.rewards.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long id,
        BigDecimal amount,
        LocalDateTime transactionDate,
        String merchant,
        String category,
        boolean processed,
        long pointsAwarded,
        String appliedCustomerType
) {
}
