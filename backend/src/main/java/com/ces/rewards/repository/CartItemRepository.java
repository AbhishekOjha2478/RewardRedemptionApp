package com.ces.rewards.repository;

import com.ces.rewards.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("select ci from CartItem ci join fetch ci.rewardItem ri join fetch ri.category where ci.customer.id = :customerId")
    List<CartItem> findByCustomerId(@Param("customerId") Long customerId);

    Optional<CartItem> findByCustomerIdAndRewardItemId(Long customerId, Long rewardItemId);

    Optional<CartItem> findByIdAndCustomerId(Long id, Long customerId);

    void deleteByCustomerId(Long customerId);

    long countByCustomerId(Long customerId);
}
