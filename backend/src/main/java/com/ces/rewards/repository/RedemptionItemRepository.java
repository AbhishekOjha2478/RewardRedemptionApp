package com.ces.rewards.repository;

import com.ces.rewards.entity.RedemptionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RedemptionItemRepository extends JpaRepository<RedemptionItem, Long> {

    List<RedemptionItem> findByRedemptionId(Long redemptionId);
}
