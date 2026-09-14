package com.ces.rewards.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "redemptions")
public class Redemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "redeemed_by_id")
    private CesUser redeemedBy;

    @Column(nullable = false, length = 40)
    private String reference;

    @Column(nullable = false)
    private long totalPoints;

    @Column(nullable = false)
    private long balanceAfter;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant redeemedAt;

    @OneToMany(mappedBy = "redemption", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RedemptionItem> items = new ArrayList<>();

    public void addItem(RedemptionItem item) {
        items.add(item);
        item.setRedemption(this);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public CesUser getRedeemedBy() {
        return redeemedBy;
    }

    public void setRedeemedBy(CesUser redeemedBy) {
        this.redeemedBy = redeemedBy;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public long getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(long totalPoints) {
        this.totalPoints = totalPoints;
    }

    public long getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(long balanceAfter) {
        this.balanceAfter = balanceAfter;
    }

    public Instant getRedeemedAt() {
        return redeemedAt;
    }

    public void setRedeemedAt(Instant redeemedAt) {
        this.redeemedAt = redeemedAt;
    }

    public List<RedemptionItem> getItems() {
        return items;
    }

    public void setItems(List<RedemptionItem> items) {
        this.items = items;
    }
}
