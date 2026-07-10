package com.celestials.controller;

import com.celestials.model.Product;
import com.celestials.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService){
        this.productService = productService;
    }

    @GetMapping
    public List<Product> list(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "section", required = false) String section,
            @RequestParam(value = "limit", required = false) Integer limit){
        int safeLimit = limit == null ? 0 : Math.max(0, limit);
        if(section != null && !section.isBlank()){
            String normalized = section.trim().toLowerCase();
            if("promotii".equals(normalized) || "promotions".equals(normalized)){
                return productService.getPromotions(safeLimit);
            }
            if("handmade".equals(normalized)){
                return productService.getHandmade(safeLimit);
            }
            if("popular".equals(normalized)){
                return productService.getPopular(safeLimit);
            }
        }
        if(type != null && !type.isBlank()){
            return productService.getByType(type);
        }
        return productService.getAll();
    }

    @GetMapping("/new-arrivals")
    public Map<String, List<Product>> newArrivals(
            @RequestParam(value = "perType", defaultValue = "3") Integer perType){
        return productService.getNewArrivalsByType(perType);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> get(@PathVariable Long id){
        try {
            Product product = productService.getById(id);
            return ResponseEntity.ok(product);
        } catch(IllegalArgumentException e){
            return ResponseEntity.notFound().build();
        }
    }

}
