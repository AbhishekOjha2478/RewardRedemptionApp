package com.ces.rewards.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AddCreditCardRequest(
        @Pattern(regexp = "\\d{16}", message = "Card number must be exactly 16 digits")
        String cardNumber,

        @Size(max = 40)
        String cardType,

        @NotNull(message = "Expiry date is required")
        @Future(message = "Expiry date must be in the future")
        LocalDate expiresOn
) {
}
