package com.celestials.dto;

public record StripeCheckoutResponse(
        String sessionId,
        String checkoutUrl,
        Long orderId,
        String paymentReference
) {}
