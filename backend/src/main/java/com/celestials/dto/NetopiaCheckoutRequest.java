package com.celestials.dto;

import java.util.List;
import java.util.Map;

public record NetopiaCheckoutRequest(
        List<Map<String, Object>> items,
        BillingInfo billing,
        String returnUrl,
        String discountCode
) {
    public record BillingInfo(
            String firstName,
            String lastName,
            String email,
            String phone,
            String country,
            String city,
            String address,
            String postalCode
    ) {}
}
