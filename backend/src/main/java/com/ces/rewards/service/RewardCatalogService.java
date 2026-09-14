package com.ces.rewards.service;

import com.ces.rewards.dto.response.RewardCategoryResponse;
import com.ces.rewards.dto.response.RewardItemResponse;
import com.ces.rewards.entity.RewardItem;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.RewardCategoryRepository;
import com.ces.rewards.repository.RewardItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RewardCatalogService {

    private final RewardCategoryRepository rewardCategoryRepository;
    private final RewardItemRepository rewardItemRepository;

    public RewardCatalogService(RewardCategoryRepository rewardCategoryRepository,
                                RewardItemRepository rewardItemRepository) {
        this.rewardCategoryRepository = rewardCategoryRepository;
        this.rewardItemRepository = rewardItemRepository;
    }

    @Transactional(readOnly = true)
    public List<RewardCategoryResponse> catalog() {
        return rewardCategoryRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(category -> new RewardCategoryResponse(
                        category.getId(),
                        category.getName(),
                        category.getDescription(),
                        rewardItemRepository
                                .findByCategoryIdAndActiveTrueOrderByPointsCostAsc(category.getId())
                                .stream().map(this::toItemResponse).toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public RewardItem requireItem(Long itemId) {
        return rewardItemRepository.findById(itemId)
                .orElseThrow(() -> ApiException.notFound("Reward item"));
    }

    public RewardItemResponse toItemResponse(RewardItem item) {
        return new RewardItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getPointsCost(),
                item.getCategory().getId(),
                item.getCategory().getName());
    }
}
