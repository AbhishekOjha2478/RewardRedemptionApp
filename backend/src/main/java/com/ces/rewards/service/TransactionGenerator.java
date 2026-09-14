package com.ces.rewards.service;

import com.ces.rewards.config.BusinessProperties;
import com.ces.rewards.entity.CreditCard;
import com.ces.rewards.entity.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class TransactionGenerator {

    private static final List<String> MERCHANTS = List.of(
            "BigBasket", "Reliance Digital", "IndianOil", "Swiggy", "Zomato", "Croma",
            "Myntra", "Apollo Pharmacy", "MakeMyTrip", "DMart", "Decathlon", "BookMyShow",
            "Tata Cliq", "Nykaa", "IRCTC", "Shoppers Stop", "Lifestyle", "Starbucks");

    private static final List<String> CATEGORIES = List.of(
            "Groceries", "Electronics", "Fuel", "Dining", "Travel", "Apparel",
            "Healthcare", "Entertainment", "Utilities");

    private final BusinessProperties businessProperties;
    private final Clock clock;
    private final Random random;

    @Autowired
    public TransactionGenerator(BusinessProperties businessProperties, Clock clock) {
        this(businessProperties, clock, new Random());
    }

    public TransactionGenerator(BusinessProperties businessProperties, Clock clock, Random random) {
        this.businessProperties = businessProperties;
        this.clock = clock;
        this.random = random;
    }

    public List<Transaction> generateFor(CreditCard card, LocalDate notBefore) {
        int count = businessProperties.transactionsPerRequest();
        long min = businessProperties.minTransactionAmount().longValue();
        long max = businessProperties.maxTransactionAmount().longValue();

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime earliest = now.minusMonths(12);
        LocalDateTime floor = notBefore.atStartOfDay();
        if (floor.isAfter(earliest)) {
            earliest = floor;
        }

        long spanMinutes = java.time.Duration.between(earliest, now).toMinutes();
        if (spanMinutes < 1) {
            spanMinutes = 1;
        }

        List<Transaction> generated = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Transaction transaction = new Transaction();
            transaction.setCreditCard(card);
            transaction.setAmount(BigDecimal.valueOf(min + (long) (random.nextDouble() * (max - min + 1))));
            transaction.setTransactionDate(earliest.plusMinutes((long) (random.nextDouble() * spanMinutes)));
            transaction.setMerchant(MERCHANTS.get(random.nextInt(MERCHANTS.size())));
            transaction.setCategory(CATEGORIES.get(random.nextInt(CATEGORIES.size())));
            transaction.setProcessed(false);
            transaction.setPointsAwarded(0L);
            generated.add(transaction);
        }
        return generated;
    }
}
