package com.celestials.controller;

import com.celestials.model.User;
import com.celestials.repository.UserRepository;
import com.celestials.service.StripeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
public class StripeController {

    private final StripeService stripeService;
    private final UserRepository userRepository;

    public StripeController(StripeService stripeService, UserRepository userRepository){
        this.stripeService = stripeService;
        this.userRepository = userRepository;
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String,Object> body, Authentication auth){
        try {
            List<Map<String,Object>> items = (List<Map<String,Object>>) body.get("items");
            User user = null;
            if(auth != null && auth.getName() != null){
                user = userRepository.findByUsername(auth.getName()).orElse(null);
            }
            Map<String,Object> result = stripeService.createCheckoutPaymentIntent(items, user);
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
            stripeService.handleWebhookEvent(payload, sigHeader);
            return ResponseEntity.ok("received");
        } catch(Exception e){
            return ResponseEntity.status(400).body("error");
        }
    }
}
