package com.ces.rewards.dto.response;

import java.time.LocalDate;

public record CustomerResponse(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        LocalDate associatedSince,
        int yearsAssociated,
        String customerType,
        long rewardPoints,
        int creditCardCount
) {
}
