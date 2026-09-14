package com.ces.rewards.repository;

import com.ces.rewards.entity.CesUser;
import com.ces.rewards.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CesUserRepository extends JpaRepository<CesUser, Long> {

    Optional<CesUser> findByUsername(String username);

    boolean existsByUsername(String username);

    long countByRoleAndActiveTrue(Role role);
}
