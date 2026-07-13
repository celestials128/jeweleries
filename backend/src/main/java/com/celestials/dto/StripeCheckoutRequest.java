package com.celestials.dto;

import java.util.List;
import java.util.Map;

public record StripeCheckoutRequest(
        List<Map<String, Object>> items,
        String successUrl,
        String cancelUrl,
        String discountCode
) {}
