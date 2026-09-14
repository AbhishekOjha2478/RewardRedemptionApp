package com.ces.rewards.controller;

import com.ces.rewards.dto.request.AddCreditCardRequest;
import com.ces.rewards.dto.response.CreditCardResponse;
import com.ces.rewards.service.CreditCardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customers/{customerId}/cards")
public class CreditCardController {

    private final CreditCardService creditCardService;

    public CreditCardController(CreditCardService creditCardService) {
        this.creditCardService = creditCardService;
    }

    @GetMapping
    public List<CreditCardResponse> list(@PathVariable Long customerId) {
        return creditCardService.findForCustomer(customerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreditCardResponse add(@PathVariable Long customerId,
                                  @Valid @RequestBody AddCreditCardRequest request) {
        return creditCardService.addToCustomer(customerId, request);
    }
}
