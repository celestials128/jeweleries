package com.celestials.controller;

import com.celestials.service.SettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
public class AdminSettingController {

    private final SettingService settingService;

    public AdminSettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(settingService.getPublicSettings());
    }

    @PostMapping("/shipping-fee")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setShippingFee(@RequestBody Map<String, Object> body) {
        try {
            BigDecimal fee = new BigDecimal(body.getOrDefault("shippingFee", "20").toString());
            settingService.setShippingFee(fee);
            return ResponseEntity.ok(Map.of("shippingFee", fee));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
