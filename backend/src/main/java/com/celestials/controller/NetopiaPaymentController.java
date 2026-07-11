package com.celestials.controller;

import com.celestials.dto.NetopiaCheckoutRequest;
import com.celestials.dto.NetopiaCheckoutResponse;
import com.celestials.model.User;
import com.celestials.repository.UserRepository;
import com.celestials.service.NetopiaPaymentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/payments/netopia")
@CrossOrigin
public class NetopiaPaymentController {

    private final NetopiaPaymentService netopiaPaymentService;
    private final UserRepository userRepository;

    public NetopiaPaymentController(NetopiaPaymentService netopiaPaymentService, UserRepository userRepository) {
        this.netopiaPaymentService = netopiaPaymentService;
        this.userRepository = userRepository;
    }

    @PostMapping("/start")
    public ResponseEntity<NetopiaCheckoutResponse> start(@RequestBody NetopiaCheckoutRequest request, Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(netopiaPaymentService.createCheckout(request, user));
    }

    @GetMapping("/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(netopiaPaymentService.getStatus());
    }

    @PostMapping(value = "/confirm", consumes = MediaType.ALL_VALUE, produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> confirm(@RequestBody(required = false) String payload) {
        netopiaPaymentService.handleConfirm(payload);
        return ResponseEntity.ok(netopiaPaymentService.buildCrcResponse());
    }

    @PostMapping(value = "/notify", consumes = MediaType.ALL_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> notify(@RequestBody(required = false) String payload) {
        netopiaPaymentService.handleNotify(payload);
        return ResponseEntity.ok(netopiaPaymentService.buildNotifyResponse());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        return user.orElse(null);
    }
}
