package com.celestials.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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

    private String imageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "image_url", nullable = false, length = 1024)
    private List<String> imageUrls;

    private Integer stock;

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

    // getters/setters
    public Long getId(){return id;} public void setId(Long id){this.id = id;}
    public String getName(){return name;} public void setName(String name){this.name = name;}
    public String getDescription(){return description;} public void setDescription(String description){this.description = description;}
    public BigDecimal getPrice(){return price;} public void setPrice(BigDecimal price){this.price = price;}
    public String getImageUrl(){return imageUrl;} public void setImageUrl(String imageUrl){this.imageUrl = imageUrl;}
    public List<String> getImageUrls(){return imageUrls;}
    public void setImageUrls(List<String> imageUrls){
        this.imageUrls = imageUrls == null ? null : new ArrayList<>(imageUrls);
    }
    public Integer getStock(){return stock;} public void setStock(Integer stock){this.stock = stock;}
}
