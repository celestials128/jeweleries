package com.celestials.repository;

import com.celestials.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findAllByOrderByCreatedAtDesc();
    Optional<Order> findByPaymentReference(String paymentReference);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.user ORDER BY o.createdAt DESC")
    List<Order> findAllWithUserOrderByCreatedAtDesc();
}
