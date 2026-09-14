package com.ces.rewards.repository;

import com.ces.rewards.entity.Customer;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByIdAndDeletedFalse(Long id);

    boolean existsByEmail(String email);

    Page<Customer> findByDeletedFalse(Pageable pageable);

    long countByDeletedFalse();

    @Query("""
            select distinct c from Customer c
            left join c.creditCards card
            where c.deleted = false
              and (
                    lower(c.firstName) like lower(concat('%', :term, '%'))
                 or lower(c.lastName) like lower(concat('%', :term, '%'))
                 or lower(concat(c.firstName, ' ', c.lastName)) like lower(concat('%', :term, '%'))
                 or card.cardNumber like concat('%', :term, '%')
              )
            """)
    Page<Customer> search(@Param("term") String term, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Customer c where c.id = :id and c.deleted = false")
    Optional<Customer> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select count(c) from Customer c
            where c.deleted = false and c.associatedSince <= :threshold
            """)
    long countPremium(@Param("threshold") LocalDate threshold);
}
