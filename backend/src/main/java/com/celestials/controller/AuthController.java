package com.celestials.controller;

import com.celestials.service.AuthService;
import com.celestials.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Numele de utilizator sau parola este incorecta.";

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, JwtUtil jwtUtil){
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String,String> body){
        try {
            String username = body.get("username");
            String password = body.get("password");
            Map<String,String> result = authService.register(username, password);
            return ResponseEntity.ok(result);
        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String,String> body){
        try {
            String username = body.get("username");
            String password = body.get("password");
            var user = authService.findByUsername(username);
            if(!authService.validatePassword(password, user.getPassword())){
                return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_MESSAGE));
            }
            String token = jwtUtil.generateToken(username);
            return ResponseEntity.ok(Map.of("token", token, "role", user.getRole(), "username", username));
        } catch(IllegalArgumentException e){
            return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_MESSAGE));
        }
    }

    @PostMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String,String> body, Authentication auth){
        try {
            if(auth == null || auth.getName() == null){
                return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
            }
            String currentPassword = body.get("currentPassword");
            String newPassword = body.get("newPassword");
            authService.changePassword(auth.getName(), currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "password_updated"));
        } catch(IllegalArgumentException e){
            if("invalid_credentials".equals(e.getMessage())){
                return ResponseEntity.status(401).body(Map.of("error", INVALID_CREDENTIALS_MESSAGE));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
