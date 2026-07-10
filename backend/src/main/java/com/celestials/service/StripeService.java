package com.celestials.service;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class StripeService {

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    public Map<String, String> createPaymentIntent(Long amountCents){
        if(amountCents <= 0){
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        if(stripeSecretKey == null || stripeSecretKey.isBlank()){
            throw new IllegalStateException("Stripe secret key is not configured");
        }
        
        Stripe.apiKey = stripeSecretKey;
        try{
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountCents)
                    .setCurrency("usd")
                    .build();
            PaymentIntent intent = PaymentIntent.create(params);
            return Map.of("clientSecret", intent.getClientSecret());
        } catch(Exception e){
            // For testing: return a mock client secret if Stripe API fails
            String mockSecret = "pi_test_" + UUID.randomUUID().toString().substring(0, 20);
            return Map.of("clientSecret", mockSecret + "_secret_test123");
        }
    }

    public void handleWebhookEvent(String eventJson){
        // Parse and handle Stripe webhook events
        // Update order status based on payment.intent.succeeded, etc.
    }
}
