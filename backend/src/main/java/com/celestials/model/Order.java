package com.celestials.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    private OffsetDateTime createdAt = OffsetDateTime.now();

    private BigDecimal total;

    private String status; // CREATED, PAID, SHIPPED, CANCELLED

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public Order() {}

    // getters/setters
    public Long getId(){return id;} public void setId(Long id){this.id = id;}
    public User getUser(){return user;} public void setUser(User user){this.user = user;}
    public OffsetDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(OffsetDateTime createdAt){this.createdAt = createdAt;}
    public BigDecimal getTotal(){return total;} public void setTotal(BigDecimal total){this.total = total;}
    public String getStatus(){return status;} public void setStatus(String status){this.status = status;}
    public List<OrderItem> getItems(){return items;} public void setItems(List<OrderItem> items){this.items = items;}
}
