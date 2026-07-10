package com.celestials.repository;

import com.celestials.model.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    interface ProductPopularityView {
        Long getProductId();
        Long getTotalQty();
    }

    @Query("""
        select oi.product.id as productId, coalesce(sum(oi.quantity), 0) as totalQty
        from OrderItem oi
        where upper(oi.order.status) = 'PAID'
        group by oi.product.id
        order by coalesce(sum(oi.quantity), 0) desc
    """)
    List<ProductPopularityView> findMostOrderedProductIds(Pageable pageable);
}
