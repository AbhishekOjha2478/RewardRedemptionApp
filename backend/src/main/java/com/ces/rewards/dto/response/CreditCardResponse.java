package com.ces.rewards.dto.response;

import java.time.LocalDate;

public record CreditCardResponse(
        Long id,
        String maskedNumber,
        String cardType,
        LocalDate issuedOn,
        LocalDate expiresOn,
        boolean active,
        long transactionCount
) {
}
