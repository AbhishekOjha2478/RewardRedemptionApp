package com.ces.rewards.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "app.business")
public record BusinessProperties(
        int transactionsPerRequest,
        BigDecimal minTransactionAmount,
        BigDecimal maxTransactionAmount,
        int premiumThresholdYears,
        BigDecimal regularRewardRate,
        BigDecimal premiumRewardRate
) {
}
