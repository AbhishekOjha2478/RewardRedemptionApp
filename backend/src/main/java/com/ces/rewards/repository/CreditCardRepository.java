package com.ces.rewards.repository;

import com.ces.rewards.entity.CreditCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CreditCardRepository extends JpaRepository<CreditCard, Long> {

    boolean existsByCardNumber(String cardNumber);

    List<CreditCard> findByCustomerIdOrderByIdAsc(Long customerId);

    Optional<CreditCard> findByIdAndCustomerId(Long id, Long customerId);

    long countByCustomerId(Long customerId);
}
