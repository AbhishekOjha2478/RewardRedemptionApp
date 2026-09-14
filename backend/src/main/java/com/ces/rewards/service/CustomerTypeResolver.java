package com.ces.rewards.service;

import com.ces.rewards.config.BusinessProperties;
import com.ces.rewards.entity.Customer;
import com.ces.rewards.entity.CustomerType;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

@Component
public class CustomerTypeResolver {

    private final int thresholdYears;
    private final Clock clock;

    public CustomerTypeResolver(BusinessProperties businessProperties, Clock clock) {
        this.thresholdYears = businessProperties.premiumThresholdYears();
        this.clock = clock;
    }

    public CustomerType resolve(Customer customer) {
        return customer.resolveType(thresholdYears, today());
    }

    public int yearsAssociated(Customer customer) {
        return customer.yearsAssociated(today());
    }

    public LocalDate premiumThresholdDate() {
        return today().minusYears(thresholdYears);
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }
}
