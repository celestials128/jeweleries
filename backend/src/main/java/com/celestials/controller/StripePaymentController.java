package com.celestials.controller;

import com.celestials.dto.StripeCheckoutRequest;
import com.celestials.dto.StripeCheckoutResponse;
import com.celestials.model.User;
import com.celestials.repository.UserRepository;
import com.celestials.service.StripePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/payments/stripe")
@CrossOrigin
public class StripePaymentController {

    private final StripePaymentService stripePaymentService;
    private final UserRepository userRepository;

    public StripePaymentController(StripePaymentService stripePaymentService, UserRepository userRepository) {
        this.stripePaymentService = stripePaymentService;
        this.userRepository = userRepository;
    }

    @PostMapping("/start")
    public ResponseEntity<StripeCheckoutResponse> start(
            @RequestBody StripeCheckoutRequest request,
            Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(stripePaymentService.createCheckout(request, user));
    }

    @GetMapping("/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(stripePaymentService.getStatus());
    }

    /**
     * Stripe webhook endpoint. Stripe sends events here (e.g. checkout.session.completed).
     * The raw body must be forwarded unchanged for signature verification.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        stripePaymentService.handleWebhook(payload, sigHeader);
        return ResponseEntity.ok("{\"received\":true}");
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username));
        return user.orElse(null);
    }
}
