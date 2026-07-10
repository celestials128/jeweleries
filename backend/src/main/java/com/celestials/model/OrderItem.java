package com.celestials.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Product product;

    private Integer quantity;

    private BigDecimal price;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    private Order order;

    public OrderItem() {}

    public OrderItem(Product product, Integer quantity, BigDecimal price){
        this.product = product; this.quantity = quantity; this.price = price;
    }

    // getters/setters
    public Long getId(){return id;} public void setId(Long id){this.id = id;}
    public Product getProduct(){return product;} public void setProduct(Product product){this.product = product;}
    public Integer getQuantity(){return quantity;} public void setQuantity(Integer quantity){this.quantity = quantity;}
    public BigDecimal getPrice(){return price;} public void setPrice(BigDecimal price){this.price = price;}
    public Order getOrder(){return order;} public void setOrder(Order order){this.order = order;}
}
