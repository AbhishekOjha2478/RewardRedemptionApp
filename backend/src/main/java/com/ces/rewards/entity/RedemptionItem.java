package com.ces.rewards.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "redemption_items")
public class RedemptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "redemption_id", nullable = false)
    private Redemption redemption;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_item_id")
    private RewardItem rewardItem;

    @Column(nullable = false, length = 120)
    private String itemName;

    @Column(length = 80)
    private String categoryName;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int pointsCostEach;

    @Column(nullable = false)
    private long lineTotal;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Redemption getRedemption() {
        return redemption;
    }

    public void setRedemption(Redemption redemption) {
        this.redemption = redemption;
    }

    public RewardItem getRewardItem() {
        return rewardItem;
    }

    public void setRewardItem(RewardItem rewardItem) {
        this.rewardItem = rewardItem;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public int getPointsCostEach() {
        return pointsCostEach;
    }

    public void setPointsCostEach(int pointsCostEach) {
        this.pointsCostEach = pointsCostEach;
    }

    public long getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(long lineTotal) {
        this.lineTotal = lineTotal;
    }
}
