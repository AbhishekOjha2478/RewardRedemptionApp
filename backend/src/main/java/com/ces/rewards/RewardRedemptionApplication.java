package com.ces.rewards;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RewardRedemptionApplication {

    public static void main(String[] args) {
        SpringApplication.run(RewardRedemptionApplication.class, args);
    }
}
