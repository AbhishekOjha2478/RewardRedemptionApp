package com.ces.rewards.dto.response;

import java.util.List;

public record CartResponse(
        Long customerId,
        List<CartLineResponse> lines,
        long totalPoints,
        long availablePoints,
        long shortfall,
        boolean redeemable
) {
}
