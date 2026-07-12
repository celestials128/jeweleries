package com.celestials.controller;

import com.celestials.model.Order;
import com.celestials.model.User;
import com.celestials.repository.OrderRepository;
import com.celestials.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public AdminUserController(UserRepository userRepository, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listUsers() {
        List<User> users = userRepository.findAll();
        List<Order> allOrders = orderRepository.findAllByOrderByCreatedAtDesc();

        Map<Long, List<Order>> ordersByUserId = allOrders.stream()
            .filter(o -> o.getUser() != null)
            .collect(Collectors.groupingBy(o -> o.getUser().getId()));

        List<Map<String, Object>> result = users.stream()
            .filter(u -> !"ROLE_ADMIN".equals(u.getRole()))
            .sorted(Comparator.comparing(User::getUsername))
            .map(user -> {
                List<Order> userOrders = ordersByUserId.getOrDefault(user.getId(), List.of());
                BigDecimal totalSpent = userOrders.stream()
                    .map(Order::getTotal)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("id", user.getId());
                dto.put("username", user.getUsername());
                dto.put("role", user.getRole());
                dto.put("orderCount", userOrders.size());
                dto.put("totalSpent", totalSpent);
                dto.put("lastOrderDate", userOrders.isEmpty() ? null : userOrders.get(0).getCreatedAt());
                return dto;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{userId}/orders")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserOrders(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> result = orders.stream().map(order -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", order.getId());
            dto.put("status", order.getStatus());
            dto.put("paymentMethod", order.getPaymentMethod());
            dto.put("total", order.getTotal());
            dto.put("createdAt", order.getCreatedAt());

            List<Map<String, Object>> items = order.getItems().stream().map(item -> {
                Map<String, Object> itemDto = new LinkedHashMap<>();
                itemDto.put("id", item.getId());
                itemDto.put("quantity", item.getQuantity());
                itemDto.put("price", item.getPrice());
                if (item.getProduct() != null) {
                    itemDto.put("productId", item.getProduct().getId());
                    itemDto.put("productName", item.getProduct().getName());
                }
                return itemDto;
            }).collect(Collectors.toList());

            dto.put("items", items);
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
