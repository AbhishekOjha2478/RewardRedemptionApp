package com.ces.rewards.service;

import com.ces.rewards.dto.request.AddToCartRequest;
import com.ces.rewards.dto.response.CartLineResponse;
import com.ces.rewards.dto.response.CartResponse;
import com.ces.rewards.entity.CartItem;
import com.ces.rewards.entity.Customer;
import com.ces.rewards.entity.RewardItem;
import com.ces.rewards.exception.ApiException;
import com.ces.rewards.repository.CartItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final CustomerService customerService;
    private final RewardCatalogService rewardCatalogService;

    public CartService(CartItemRepository cartItemRepository,
                       CustomerService customerService,
                       RewardCatalogService rewardCatalogService) {
        this.cartItemRepository = cartItemRepository;
        this.customerService = customerService;
        this.rewardCatalogService = rewardCatalogService;
    }

    @Transactional(readOnly = true)
    public CartResponse viewCart(Long customerId) {
        Customer customer = customerService.requireCustomer(customerId);
        return buildCart(customer);
    }

    @Transactional
    public CartResponse addItem(Long customerId, AddToCartRequest request) {
        Customer customer = customerService.requireCustomer(customerId);
        RewardItem item = rewardCatalogService.requireItem(request.rewardItemId());

        if (!item.isActive()) {
            throw ApiException.badRequest("That reward is no longer available");
        }

        CartItem existing = cartItemRepository
                .findByCustomerIdAndRewardItemId(customerId, item.getId())
                .orElse(null);

        if (existing == null) {
            CartItem cartItem = new CartItem();
            cartItem.setCustomer(customer);
            cartItem.setRewardItem(item);
            cartItem.setQuantity(request.quantity());
            cartItemRepository.save(cartItem);
        } else {
            int combined = existing.getQuantity() + request.quantity();
            if (combined > 20) {
                throw ApiException.badRequest("Quantity cannot be more than 20 per reward");
            }
            existing.setQuantity(combined);
        }

        return buildCart(customer);
    }

    @Transactional
    public CartResponse updateQuantity(Long customerId, Long cartItemId, int quantity) {
        Customer customer = customerService.requireCustomer(customerId);
        CartItem cartItem = cartItemRepository.findByIdAndCustomerId(cartItemId, customerId)
                .orElseThrow(() -> ApiException.notFound("Cart item"));
        cartItem.setQuantity(quantity);
        return buildCart(customer);
    }

    @Transactional
    public CartResponse removeItem(Long customerId, Long cartItemId) {
        Customer customer = customerService.requireCustomer(customerId);
        CartItem cartItem = cartItemRepository.findByIdAndCustomerId(cartItemId, customerId)
                .orElseThrow(() -> ApiException.notFound("Cart item"));
        cartItemRepository.delete(cartItem);
        return buildCart(customer);
    }

    @Transactional
    public CartResponse clear(Long customerId) {
        Customer customer = customerService.requireCustomer(customerId);
        cartItemRepository.deleteByCustomerId(customerId);
        return buildCart(customer);
    }

    private CartResponse buildCart(Customer customer) {
        List<CartItem> items = cartItemRepository.findByCustomerId(customer.getId());
        List<CartLineResponse> lines = items.stream().map(this::toLine).toList();
        long total = lines.stream().mapToLong(CartLineResponse::lineTotal).sum();
        long available = customer.getRewardPoints();
        long shortfall = Math.max(0L, total - available);

        return new CartResponse(
                customer.getId(),
                lines,
                total,
                available,
                shortfall,
                !lines.isEmpty() && shortfall == 0L);
    }

    private CartLineResponse toLine(CartItem cartItem) {
        RewardItem item = cartItem.getRewardItem();
        return new CartLineResponse(
                cartItem.getId(),
                item.getId(),
                item.getName(),
                item.getCategory().getName(),
                item.getPointsCost(),
                cartItem.getQuantity(),
                cartItem.lineTotal());
    }
}
