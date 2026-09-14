package com.ces.rewards.service;

import com.ces.rewards.dto.request.AddCreditCardRequest;
import com.ces.rewards.dto.response.CreditCardResponse;
import com.ces.rewards.entity.CreditCard;
import com.ces.rewards.entity.Customer;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.CreditCardRepository;
import com.ces.rewards.repository.TransactionRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class CreditCardService {

    private final CreditCardRepository creditCardRepository;
    private final TransactionRepository transactionRepository;
    private final CustomerService customerService;
    private final Clock clock;

    public CreditCardService(CreditCardRepository creditCardRepository,
                             TransactionRepository transactionRepository,
                             CustomerService customerService,
                             Clock clock) {
        this.creditCardRepository = creditCardRepository;
        this.transactionRepository = transactionRepository;
        this.customerService = customerService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<CreditCardResponse> findForCustomer(Long customerId) {
        customerService.requireCustomer(customerId);
        return creditCardRepository.findByCustomerIdOrderByIdAsc(customerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CreditCardResponse addToCustomer(Long customerId, AddCreditCardRequest request) {
        Customer customer = customerService.requireCustomer(customerId);

        if (creditCardRepository.existsByCardNumber(request.cardNumber())) {
            throw ApiException.conflict("This card number is already registered");
        }

        CreditCard card = new CreditCard();
        card.setCustomer(customer);
        card.setCardNumber(request.cardNumber());
        card.setCardType(request.cardType() == null || request.cardType().isBlank()
                ? "Standard" : request.cardType().trim());
        card.setIssuedOn(LocalDate.now(clock));
        card.setExpiresOn(request.expiresOn());
        card.setActive(true);

        try {
            return toResponse(creditCardRepository.saveAndFlush(card));
        } catch (DataIntegrityViolationException ex) {
            throw ApiException.conflict("This card number is already registered");
        }
    }

    @Transactional(readOnly = true)
    public CreditCard requireCard(Long cardId) {
        return creditCardRepository.findById(cardId)
                .orElseThrow(() -> ApiException.notFound("Credit card"));
    }

    public CreditCardResponse toResponse(CreditCard card) {
        return new CreditCardResponse(
                card.getId(),
                card.getMaskedNumber(),
                card.getCardType(),
                card.getIssuedOn(),
                card.getExpiresOn(),
                card.isActive(),
                transactionRepository.countByCreditCardId(card.getId()));
    }
}
