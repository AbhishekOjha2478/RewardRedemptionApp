package com.ces.rewards.service;

import com.ces.rewards.dto.response.PageResponse;
import com.ces.rewards.dto.response.TransactionResponse;
import com.ces.rewards.entity.CreditCard;
import com.ces.rewards.entity.Transaction;
import com.ces.rewards.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CreditCardService creditCardService;
    private final TransactionGenerator transactionGenerator;

    public TransactionService(TransactionRepository transactionRepository,
                              CreditCardService creditCardService,
                              TransactionGenerator transactionGenerator) {
        this.transactionRepository = transactionRepository;
        this.creditCardService = creditCardService;
        this.transactionGenerator = transactionGenerator;
    }

    @Transactional
    public List<TransactionResponse> generateForCard(Long cardId) {
        CreditCard card = creditCardService.requireCard(cardId);
        List<Transaction> generated = transactionGenerator.generateFor(
                card, card.getCustomer().getAssociatedSince());
        return transactionRepository.saveAll(generated).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> findForCard(Long cardId, Pageable pageable) {
        creditCardService.requireCard(cardId);
        Page<Transaction> page = transactionRepository
                .findByCreditCardIdOrderByTransactionDateDesc(cardId, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    public TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getTransactionDate(),
                transaction.getMerchant(),
                transaction.getCategory(),
                transaction.isProcessed(),
                transaction.getPointsAwarded(),
                transaction.getAppliedCustomerType() == null
                        ? null : transaction.getAppliedCustomerType().name());
    }
}
