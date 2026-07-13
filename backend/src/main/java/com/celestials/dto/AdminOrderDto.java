package com.celestials.dto;

import com.celestials.model.Order;
import com.celestials.model.OrderItem;
import com.celestials.model.User;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminOrderDto(
        Long id,
        String status,
        String paymentMethod,
        BigDecimal total,
        BigDecimal discountAmount,
        String discountCode,
        String userIdentity,
        OffsetDateTime createdAt,
        List<ItemDto> items
) {
    public record ItemDto(String productName, Integer quantity, BigDecimal price) {}

    public static AdminOrderDto from(Order order) {
        User user = order.getUser();
        String identity = null;
        if (user != null) {
            String username = user.getUsername();
            String email = user.getEmail();
            boolean usernameIsEmail = username != null && username.contains("@");
            if (!usernameIsEmail && username != null && !username.isBlank()) {
                identity = username;
            } else if (email != null && !email.isBlank()) {
                identity = email;
            } else if (username != null && !username.isBlank()) {
                identity = username;
            }
        }

        List<ItemDto> items = order.getItems().stream()
                .map(i -> new ItemDto(
                        i.getProduct() != null ? i.getProduct().getName() : "Produs",
                        i.getQuantity(),
                        i.getPrice()
                ))
                .toList();

        return new AdminOrderDto(
                order.getId(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getTotal(),
                order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO,
                order.getDiscountCode(),
                identity,
                order.getCreatedAt(),
                items
        );
    }
}
