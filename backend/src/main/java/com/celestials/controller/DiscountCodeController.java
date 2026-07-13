package com.celestials.controller;

import com.celestials.service.DiscountCodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/discount-codes")
public class DiscountCodeController {

    private final DiscountCodeService discountCodeService;

    public DiscountCodeController(DiscountCodeService discountCodeService) {
        this.discountCodeService = discountCodeService;
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody Map<String, Object> body, Authentication authentication) {
        try {
            String code = (String) body.getOrDefault("code", "");
            BigDecimal total = new BigDecimal(body.getOrDefault("total", "0").toString());
            String username = authentication != null && authentication.isAuthenticated() ? authentication.getName() : null;
            return ResponseEntity.ok(discountCodeService.validate(code, total, username));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
