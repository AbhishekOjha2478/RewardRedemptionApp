package com.ces.rewards.service;

import com.ces.rewards.dto.request.CreateCustomerRequest;
import com.ces.rewards.dto.response.CustomerResponse;
import com.ces.rewards.dto.response.PageResponse;
import com.ces.rewards.entity.Customer;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.CreditCardRepository;
import com.ces.rewards.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CreditCardRepository creditCardRepository;
    private final CustomerTypeResolver customerTypeResolver;
    private final Clock clock;

    public CustomerService(CustomerRepository customerRepository,
                           CreditCardRepository creditCardRepository,
                           CustomerTypeResolver customerTypeResolver,
                           Clock clock) {
        this.customerRepository = customerRepository;
        this.creditCardRepository = creditCardRepository;
        this.customerTypeResolver = customerTypeResolver;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> search(String term, Pageable pageable) {
        Page<Customer> page = (term == null || term.isBlank())
                ? customerRepository.findByDeletedFalse(pageable)
                : customerRepository.search(term.trim(), pageable);
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        return toResponse(requireCustomer(id));
    }

    @Transactional
    public CustomerResponse create(CreateCustomerRequest request) {
        if (customerRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("A customer with that email already exists");
        }

        Customer customer = new Customer();
        customer.setFirstName(request.firstName().trim());
        customer.setLastName(request.lastName().trim());
        customer.setEmail(request.email().trim());
        customer.setPhone(request.phone());
        customer.setAssociatedSince(request.associatedSince());
        customer.setRewardPoints(0L);
        customer.setDeleted(false);

        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public void softDelete(Long id) {
        Customer customer = requireCustomer(id);
        customer.setDeleted(true);
        customer.setDeletedAt(Instant.now(clock));
    }

    @Transactional(readOnly = true)
    public Customer requireCustomer(Long id) {
        return customerRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> ApiException.notFound("Customer"));
    }

    public CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getFirstName(),
                customer.getLastName(),
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getAssociatedSince(),
                customerTypeResolver.yearsAssociated(customer),
                customerTypeResolver.resolve(customer).name(),
                customer.getRewardPoints(),
                (int) creditCardRepository.countByCustomerId(customer.getId()));
    }
}
