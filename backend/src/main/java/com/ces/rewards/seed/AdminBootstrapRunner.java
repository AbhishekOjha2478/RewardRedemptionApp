package com.ces.rewards.seed;

import com.ces.rewards.config.SeedProperties;
import com.ces.rewards.entity.CesUser;
import com.ces.rewards.entity.Role;
import com.ces.rewards.repository.CesUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final CesUserRepository cesUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedProperties seedProperties;

    public AdminBootstrapRunner(CesUserRepository cesUserRepository,
                                PasswordEncoder passwordEncoder,
                                SeedProperties seedProperties) {
        this.cesUserRepository = cesUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedProperties = seedProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (cesUserRepository.count() > 0) {
            return;
        }

        CesUser admin = new CesUser();
        admin.setUsername(seedProperties.adminUsername());
        admin.setPasswordHash(passwordEncoder.encode(seedProperties.adminPassword()));
        admin.setFullName(seedProperties.adminFullName());
        admin.setEmail(seedProperties.adminEmail());
        admin.setRole(Role.ADMIN_CES);
        admin.setActive(true);
        cesUserRepository.save(admin);

        log.info("Created bootstrap administrator '{}'", seedProperties.adminUsername());
    }
}
