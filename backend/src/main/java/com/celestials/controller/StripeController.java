package com.celestials.controller;

import com.celestials.service.StripeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
public class StripeController {

    private final StripeService stripeService;

    public StripeController(StripeService stripeService){
        this.stripeService = stripeService;
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String,Object> body){
        try {
            Long amount = ((Number)body.getOrDefault("amount", 0)).longValue();
            Map<String,String> result = stripeService.createPaymentIntent(amount);
            return ResponseEntity.ok(result);
        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch(Exception e){
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestHeader(value="Stripe-Signature", required = false) String sigHeader){
        try {
            stripeService.handleWebhookEvent(payload);
            return ResponseEntity.ok("received");
        } catch(Exception e){
            return ResponseEntity.status(400).body("error");
        }
    }
}
