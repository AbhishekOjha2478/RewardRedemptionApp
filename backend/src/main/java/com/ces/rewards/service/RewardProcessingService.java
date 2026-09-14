package com.ces.rewards.service;

import com.ces.rewards.dto.response.RewardProcessingResponse;
import com.ces.rewards.dto.response.RewardSummaryResponse;
import com.ces.rewards.entity.Customer;
import com.ces.rewards.entity.CustomerType;
import com.ces.rewards.entity.Transaction;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.CustomerRepository;
import com.ces.rewards.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
public class RewardProcessingService {

    private final CustomerRepository customerRepository;
    private final TransactionRepository transactionRepository;
    private final CustomerTypeResolver customerTypeResolver;
    private final RewardCalculator rewardCalculator;
    private final Clock clock;

    public RewardProcessingService(CustomerRepository customerRepository,
                                   TransactionRepository transactionRepository,
                                   CustomerTypeResolver customerTypeResolver,
                                   RewardCalculator rewardCalculator,
                                   Clock clock) {
        this.customerRepository = customerRepository;
        this.transactionRepository = transactionRepository;
        this.customerTypeResolver = customerTypeResolver;
        this.rewardCalculator = rewardCalculator;
        this.clock = clock;
    }

    @Transactional
    public RewardProcessingResponse processForCustomer(Long customerId) {
        Customer customer = customerRepository.findByIdForUpdate(customerId)
                .orElseThrow(() -> ApiException.notFound("Customer"));

        CustomerType type = customerTypeResolver.resolve(customer);
        List<Transaction> pending = transactionRepository.findUnprocessedByCustomer(customerId);

        long pointsEarned = 0L;
        Instant processedAt = Instant.now(clock);

        for (Transaction transaction : pending) {
            long points = rewardCalculator.pointsFor(transaction.getAmount(), type);
            transaction.setProcessed(true);
            transaction.setProcessedAt(processedAt);
            transaction.setPointsAwarded(points);
            transaction.setAppliedCustomerType(type);
            pointsEarned += points;
        }

        customer.setRewardPoints(customer.getRewardPoints() + pointsEarned);

        return new RewardProcessingResponse(
                customer.getId(),
                type.name(),
                rewardCalculator.describeRate(type),
                pending.size(),
                pointsEarned,
                customer.getRewardPoints());
    }

    @Transactional(readOnly = true)
    public RewardSummaryResponse summaryFor(Long customerId) {
        Customer customer = customerRepository.findByIdAndDeletedFalse(customerId)
                .orElseThrow(() -> ApiException.notFound("Customer"));
        CustomerType type = customerTypeResolver.resolve(customer);

        return new RewardSummaryResponse(
                customer.getId(),
                type.name(),
                rewardCalculator.describeRate(type),
                customer.getRewardPoints(),
                transactionRepository.countUnprocessedByCustomer(customerId));
    }
}
