package com.celestials.controller;

import com.celestials.dto.AdminOrderDto;
import com.celestials.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminOrderDto>> listAllOrders() {
        List<AdminOrderDto> dtos = orderService.getAllOrdersWithUser().stream()
                .map(AdminOrderDto::from)
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
