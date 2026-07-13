package com.celestials.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type_id")
    private ProductType type;

    private String imageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "image_url", nullable = false, length = 1024)
    private List<String> imageUrls;

    private Integer stock;

    @Column(nullable = false)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean handmade = false;

    @Column(nullable = false)
    private Boolean popular = false;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Product() {}

    public Product(String name, String description, BigDecimal price, String imageUrl, Integer stock){
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.stock = stock;
        if(imageUrl != null && !imageUrl.isBlank()){
            this.imageUrls = new ArrayList<>();
            this.imageUrls.add(imageUrl);
        }
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (discountPercent == null) discountPercent = BigDecimal.ZERO;
        if (handmade == null) handmade = false;
        if (popular == null) popular = false;
    }

    // getters/setters
    public Long getId(){return id;} public void setId(Long id){this.id = id;}
    public String getName(){return name;} public void setName(String name){this.name = name;}
    public String getDescription(){return description;} public void setDescription(String description){this.description = description;}
    public BigDecimal getPrice(){return price;} public void setPrice(BigDecimal price){this.price = price;}
    public ProductType getType(){return type;} public void setType(ProductType type){this.type = type;}
    public String getImageUrl(){return imageUrl;} public void setImageUrl(String imageUrl){this.imageUrl = imageUrl;}
    public List<String> getImageUrls(){return imageUrls;}
    public void setImageUrls(List<String> imageUrls){
        this.imageUrls = imageUrls == null ? null : new ArrayList<>(imageUrls);
    }
    public Integer getStock(){return stock;} public void setStock(Integer stock){this.stock = stock;}
    public BigDecimal getDiscountPercent(){return discountPercent;}
    public void setDiscountPercent(BigDecimal discountPercent){this.discountPercent = discountPercent;}
    public Boolean getHandmade(){return handmade;}
    public void setHandmade(Boolean handmade){this.handmade = handmade;}
    public Boolean getPopular(){return popular;}
    public void setPopular(Boolean popular){this.popular = popular;}
    public OffsetDateTime getCreatedAt(){return createdAt;}
    public void setCreatedAt(OffsetDateTime createdAt){this.createdAt = createdAt;}

    @Transient
    public BigDecimal getDiscountedPrice() {
        if (price == null) return BigDecimal.ZERO;
        BigDecimal discount = discountPercent == null ? BigDecimal.ZERO : discountPercent;
        if (discount.signum() <= 0) return price;
        BigDecimal percentMultiplier = BigDecimal.valueOf(100).subtract(discount)
            .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return price.multiply(percentMultiplier).setScale(2, RoundingMode.HALF_UP);
    }
}
