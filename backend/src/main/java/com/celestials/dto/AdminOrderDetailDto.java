package com.celestials.dto;

import com.celestials.model.Order;
import com.celestials.model.OrderItem;
import com.celestials.model.User;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminOrderDetailDto(
        Long id,
        String status,
        String paymentMethod,
        String paymentReference,
        BigDecimal total,
        BigDecimal discountAmount,
        String discountCode,
        String userIdentity,
        String username,
        String email,
        OffsetDateTime createdAt,
        List<ItemDto> items
) {
    public record ItemDto(Long productId, String productName, Integer quantity, BigDecimal price, BigDecimal lineTotal) {}

    public static AdminOrderDetailDto from(Order order) {
        User user = order.getUser();
        String username = user != null ? user.getUsername() : null;
        String email = user != null ? user.getEmail() : null;
        String identity = null;
        if (user != null) {
            if (username != null && !username.isBlank() && !username.contains("@")) {
                identity = username;
            } else if (email != null && !email.isBlank()) {
                identity = email;
            } else if (username != null && !username.isBlank()) {
                identity = username;
            }
        }

        List<ItemDto> items = order.getItems().stream()
                .map(i -> {
                    Long productId = i.getProduct() != null ? i.getProduct().getId() : null;
                    String productName = i.getProduct() != null ? i.getProduct().getName() : "Produs";
                    Integer quantity = i.getQuantity();
                    BigDecimal price = i.getPrice();
                    BigDecimal lineTotal = price != null && quantity != null
                            ? price.multiply(BigDecimal.valueOf(quantity))
                            : BigDecimal.ZERO;
                    return new ItemDto(productId, productName, quantity, price, lineTotal);
                })
                .toList();

        return new AdminOrderDetailDto(
                order.getId(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getPaymentReference(),
                order.getTotal(),
                order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO,
                order.getDiscountCode(),
                identity,
                username,
                email,
                order.getCreatedAt(),
                items
        );
    }
}
