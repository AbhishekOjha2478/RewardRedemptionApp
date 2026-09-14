package com.ces.rewards.repository;

import com.ces.rewards.entity.RewardCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RewardCategoryRepository extends JpaRepository<RewardCategory, Long> {

    List<RewardCategory> findByActiveTrueOrderByDisplayOrderAsc();
}
