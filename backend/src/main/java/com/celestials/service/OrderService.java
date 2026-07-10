package com.celestials.service;

import com.celestials.model.Order;
import com.celestials.model.OrderItem;
import com.celestials.model.Product;
import com.celestials.model.User;
import com.celestials.repository.OrderRepository;
import com.celestials.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository){
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    public List<Order> getUserOrders(User user){
        return orderRepository.findAll().stream()
                .filter(o -> o.getUser().getId().equals(user.getId()))
                .toList();
    }

    public Order getOrder(Long orderId, User user){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if(!order.getUser().getId().equals(user.getId())){
            throw new IllegalArgumentException("Unauthorized");
        }
        return order;
    }

    public Order createOrder(List<Map<String,Object>> items, User user){
        if(items == null || items.isEmpty()){
            throw new IllegalArgumentException("Order must contain items");
        }

        Order order = new Order();
        order.setUser(user);
        order.setStatus("CREATED");
        BigDecimal total = BigDecimal.ZERO;

        for(Map<String,Object> item : items){
            Long productId = ((Number)item.get("productId")).longValue();
            Integer qty = ((Number)item.get("quantity")).intValue();
            
            Product prod = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
            
            if(prod.getStock() < qty){
                throw new IllegalArgumentException("Insufficient stock for " + prod.getName());
            }
            
            OrderItem oi = new OrderItem(prod, qty, prod.getPrice());
            oi.setOrder(order);
            order.getItems().add(oi);
            total = total.add(prod.getPrice().multiply(BigDecimal.valueOf(qty)));
        }

        order.setTotal(total);
        return orderRepository.save(order);
    }

    public Order updateStatus(Long orderId, String newStatus){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        order.setStatus(newStatus);
        return orderRepository.save(order);
    }
}
