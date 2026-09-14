package com.ces.rewards.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed")
public record SeedProperties(
        String adminUsername,
        String adminPassword,
        String adminEmail,
        String adminFullName
) {
}
