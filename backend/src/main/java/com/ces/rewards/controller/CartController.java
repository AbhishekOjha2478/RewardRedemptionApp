package com.ces.rewards.controller;

import com.ces.rewards.dto.request.AddToCartRequest;
import com.ces.rewards.dto.request.UpdateCartQuantityRequest;
import com.ces.rewards.dto.response.CartResponse;
import com.ces.rewards.service.CartService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers/{customerId}/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse view(@PathVariable Long customerId) {
        return cartService.viewCart(customerId);
    }

    @PostMapping("/items")
    public CartResponse addItem(@PathVariable Long customerId,
                                @Valid @RequestBody AddToCartRequest request) {
        return cartService.addItem(customerId, request);
    }

    @PatchMapping("/items/{cartItemId}")
    public CartResponse updateQuantity(@PathVariable Long customerId,
                                       @PathVariable Long cartItemId,
                                       @Valid @RequestBody UpdateCartQuantityRequest request) {
        return cartService.updateQuantity(customerId, cartItemId, request.quantity());
    }

    @DeleteMapping("/items/{cartItemId}")
    public CartResponse removeItem(@PathVariable Long customerId, @PathVariable Long cartItemId) {
        return cartService.removeItem(customerId, cartItemId);
    }

    @DeleteMapping
    public CartResponse clear(@PathVariable Long customerId) {
        return cartService.clear(customerId);
    }
}
