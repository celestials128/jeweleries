package com.celestials.controller;

import com.celestials.service.SettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public ResponseEntity<?> getPublicSettings() {
        return ResponseEntity.ok(settingService.getPublicSettings());
    }
}
