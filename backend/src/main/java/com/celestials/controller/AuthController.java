package com.celestials.controller;

import com.celestials.service.AuthService;
import com.celestials.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

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
                return ResponseEntity.status(401).body(Map.of("error","invalid_credentials"));
            }
            String token = jwtUtil.generateToken(username);
            return ResponseEntity.ok(Map.of("token", token));
        } catch(IllegalArgumentException e){
            return ResponseEntity.status(401).body(Map.of("error", "invalid_credentials"));
        }
    }
}
