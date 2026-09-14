package com.ces.rewards.service;

import com.ces.rewards.dto.response.PageResponse;
import com.ces.rewards.dto.response.RedemptionLineResponse;
import com.ces.rewards.dto.response.RedemptionResponse;
import com.ces.rewards.entity.CartItem;
import com.ces.rewards.entity.CesUser;
import com.ces.rewards.entity.Customer;
import com.ces.rewards.entity.Redemption;
import com.ces.rewards.entity.RedemptionItem;
import com.ces.rewards.entity.RewardItem;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.CartItemRepository;
import com.ces.rewards.repository.CesUserRepository;
import com.ces.rewards.repository.CustomerRepository;
import com.ces.rewards.repository.RedemptionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class RedemptionService {

    private static final String REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final DateTimeFormatter REFERENCE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final CustomerRepository customerRepository;
    private final CartItemRepository cartItemRepository;
    private final RedemptionRepository redemptionRepository;
    private final CesUserRepository cesUserRepository;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public RedemptionService(CustomerRepository customerRepository,
                             CartItemRepository cartItemRepository,
                             RedemptionRepository redemptionRepository,
                             CesUserRepository cesUserRepository,
                             Clock clock) {
        this.customerRepository = customerRepository;
        this.cartItemRepository = cartItemRepository;
        this.redemptionRepository = redemptionRepository;
        this.cesUserRepository = cesUserRepository;
        this.clock = clock;
    }

    @Transactional
    public RedemptionResponse redeemCart(Long customerId, String requestingUsername) {
        Customer customer = customerRepository.findByIdForUpdate(customerId)
                .orElseThrow(() -> ApiException.notFound("Customer"));

        List<CartItem> cartItems = cartItemRepository.findByCustomerId(customerId);
        if (cartItems.isEmpty()) {
            throw ApiException.unprocessable("The cart is empty");
        }

        long total = 0L;
        for (CartItem cartItem : cartItems) {
            total += cartItem.lineTotal();
        }

        if (customer.getRewardPoints() < total) {
            long shortfall = total - customer.getRewardPoints();
            throw ApiException.unprocessable("Catalogue value exceeds the reward points available. "
                    + "This cart costs " + total + " points, the customer has "
                    + customer.getRewardPoints() + ", leaving a shortfall of " + shortfall + " points.");
        }

        customer.setRewardPoints(customer.getRewardPoints() - total);

        Redemption redemption = new Redemption();
        redemption.setCustomer(customer);
        redemption.setReference(nextReference());
        redemption.setTotalPoints(total);
        redemption.setBalanceAfter(customer.getRewardPoints());
        cesUserRepository.findByUsername(requestingUsername).ifPresent(redemption::setRedeemedBy);

        for (CartItem cartItem : cartItems) {
            RewardItem item = cartItem.getRewardItem();
            RedemptionItem line = new RedemptionItem();
            line.setRewardItem(item);
            line.setItemName(item.getName());
            line.setCategoryName(item.getCategory().getName());
            line.setQuantity(cartItem.getQuantity());
            line.setPointsCostEach(item.getPointsCost());
            line.setLineTotal(cartItem.lineTotal());
            redemption.addItem(line);
        }

        Redemption saved = redemptionRepository.save(redemption);
        cartItemRepository.deleteAll(cartItems);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<RedemptionResponse> historyFor(Long customerId, Pageable pageable) {
        Page<Redemption> page = redemptionRepository
                .findByCustomerIdOrderByRedeemedAtDesc(customerId, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public RedemptionResponse findById(Long redemptionId) {
        return redemptionRepository.findById(redemptionId)
                .map(this::toResponse)
                .orElseThrow(() -> ApiException.notFound("Redemption"));
    }

    public RedemptionResponse toResponse(Redemption redemption) {
        List<RedemptionLineResponse> lines = redemption.getItems().stream()
                .map(line -> new RedemptionLineResponse(
                        line.getItemName(),
                        line.getCategoryName(),
                        line.getQuantity(),
                        line.getPointsCostEach(),
                        line.getLineTotal()))
                .toList();

        CesUser redeemedBy = redemption.getRedeemedBy();

        return new RedemptionResponse(
                redemption.getId(),
                redemption.getReference(),
                redemption.getTotalPoints(),
                redemption.getBalanceAfter(),
                redemption.getRedeemedAt(),
                redeemedBy == null ? null : redeemedBy.getFullName(),
                lines);
    }

    private String nextReference() {
        for (int attempt = 0; attempt < 5; attempt++) {
            StringBuilder suffix = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                suffix.append(REFERENCE_ALPHABET.charAt(random.nextInt(REFERENCE_ALPHABET.length())));
            }
            String reference = "RDM-" + LocalDate.now(clock).format(REFERENCE_DATE) + "-" + suffix;
            if (!redemptionRepository.existsByReference(reference)) {
                return reference;
            }
        }
        throw new IllegalStateException("Could not generate a unique redemption reference");
    }
}
