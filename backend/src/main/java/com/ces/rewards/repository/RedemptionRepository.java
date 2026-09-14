package com.ces.rewards.repository;

import com.ces.rewards.entity.Redemption;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RedemptionRepository extends JpaRepository<Redemption, Long> {

    Page<Redemption> findByCustomerIdOrderByRedeemedAtDesc(Long customerId, Pageable pageable);

    List<Redemption> findByCustomerIdOrderByRedeemedAtDesc(Long customerId);

    Optional<Redemption> findByReference(String reference);

    boolean existsByReference(String reference);
}
