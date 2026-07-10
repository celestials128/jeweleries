package com.celestials.controller;

import com.celestials.model.Order;
import com.celestials.model.User;
import com.celestials.repository.UserRepository;
import com.celestials.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository){
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> listUserOrders(Authentication auth){
        try {
            User user = userRepository.findByUsername(auth.getName()).orElseThrow();
            List<Order> orders = orderService.getUserOrders(user);
            return ResponseEntity.ok(orders);
        } catch(Exception e){
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id, Authentication auth){
        try {
            User user = userRepository.findByUsername(auth.getName()).orElseThrow();
            Order order = orderService.getOrder(id, user);
            return ResponseEntity.ok(order);
        } catch(IllegalArgumentException e){
            if(e.getMessage().equals("Unauthorized")) return ResponseEntity.status(403).build();
            return ResponseEntity.notFound().build();
        } catch(Exception e){
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String,Object> body, Authentication auth){
        try {
            User user = userRepository.findByUsername(auth.getName()).orElseThrow();
            List<Map<String,Object>> items = (List<Map<String,Object>>)body.get("items");
            Order order = orderService.createOrder(items, user);
            return ResponseEntity.ok(order);
        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch(Exception e){
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String,String> body){
        try {
            Order order = orderService.updateStatus(id, body.getOrDefault("status", "CREATED"));
            return ResponseEntity.ok(order);
        } catch(IllegalArgumentException e){
            return ResponseEntity.notFound().build();
        }
    }
}
