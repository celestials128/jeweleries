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
            if (auth == null) {
                return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
            }
            User user = resolveUser(auth);
            List<Order> orders = orderService.getUserOrders(user);
            return ResponseEntity.ok(orders);
        } catch(Exception e){
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id, Authentication auth){
        try {
            if (auth == null) {
                return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
            }
            User user = resolveUser(auth);
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
            User user = null;
            if (auth != null) {
                user = userRepository.findByUsername(auth.getName())
                        .or(() -> userRepository.findByEmail(auth.getName()))
                        .orElse(null);
            }
            List<Map<String,Object>> items = (List<Map<String,Object>>)body.get("items");
            String paymentMethod = body.getOrDefault("paymentMethod", "CASH_ON_DELIVERY").toString();
            String discountCode = body.containsKey("discountCode") ? (String) body.get("discountCode") : null;
            Order order = orderService.createOrder(items, user, paymentMethod, discountCode);
            return ResponseEntity.ok(order);
        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch(Exception e){
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<?> claimOrder(@PathVariable Long id, Authentication auth) {
        try {
            if (auth == null) {
                return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
            }
            User user = resolveUser(auth);
            Order order = orderService.claimOrderForUser(id, user);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            if ("Unauthorized".equals(e.getMessage())) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String,String> body, Authentication auth){
        try {
            if (auth == null) {
                return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
            }
            User user = resolveUser(auth);
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
            Order order = orderService.updateStatusForUser(id, body.getOrDefault("status", "CREATED"), user, isAdmin);
            return ResponseEntity.ok(order);
        } catch(IllegalArgumentException e){
            if("Unauthorized".equals(e.getMessage())){
                return ResponseEntity.status(403).build();
            }
            if("ForbiddenStatus".equals(e.getMessage())){
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can set this status"));
            }
            return ResponseEntity.notFound().build();
        } catch(Exception e){
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }

    private User resolveUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .or(() -> userRepository.findByEmail(auth.getName()))
                .orElseThrow();
    }
}
