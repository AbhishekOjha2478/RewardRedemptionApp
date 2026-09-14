package com.ces.rewards.service;

import com.ces.rewards.config.BusinessProperties;
import com.ces.rewards.entity.CustomerType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class RewardCalculator {

    private final BigDecimal regularRate;
    private final BigDecimal premiumRate;

    public RewardCalculator(BusinessProperties businessProperties) {
        this.regularRate = businessProperties.regularRewardRate();
        this.premiumRate = businessProperties.premiumRewardRate();
    }

    public long pointsFor(BigDecimal amount, CustomerType type) {
        return amount.multiply(rateFor(type))
                .setScale(0, RoundingMode.FLOOR)
                .longValueExact();
    }

    public BigDecimal rateFor(CustomerType type) {
        return type == CustomerType.PREMIUM ? premiumRate : regularRate;
    }

    public String describeRate(CustomerType type) {
        return rateFor(type).multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%";
    }
}
