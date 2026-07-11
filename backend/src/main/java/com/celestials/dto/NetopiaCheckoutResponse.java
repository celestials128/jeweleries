package com.celestials.dto;

public record NetopiaCheckoutResponse(
        String startUrl,
        String data,
        String envKey,
        String paymentReference,
        Long orderId
) {}
