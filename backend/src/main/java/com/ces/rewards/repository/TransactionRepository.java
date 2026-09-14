package com.ces.rewards.repository;

import com.ces.rewards.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByCreditCardIdOrderByTransactionDateDesc(Long creditCardId, Pageable pageable);

    long countByCreditCardId(Long creditCardId);

    @Query("""
            select t from Transaction t
            where t.creditCard.customer.id = :customerId and t.processed = false
            """)
    List<Transaction> findUnprocessedByCustomer(@Param("customerId") Long customerId);

    @Query("""
            select count(t) from Transaction t
            where t.creditCard.customer.id = :customerId and t.processed = false
            """)
    long countUnprocessedByCustomer(@Param("customerId") Long customerId);

    @Query("""
            select t from Transaction t
            where t.creditCard.customer.id = :customerId
            order by t.transactionDate desc
            """)
    List<Transaction> findRecentByCustomer(@Param("customerId") Long customerId, Pageable pageable);
}
