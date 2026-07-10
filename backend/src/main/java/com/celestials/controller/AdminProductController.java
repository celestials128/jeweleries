package com.celestials.controller;

import com.celestials.model.Product;
import com.celestials.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService){
        this.productService = productService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Product> listProducts(){
        return productService.getAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createProduct(@RequestBody Product product){
        try {
            Product saved = productService.create(product);
            return ResponseEntity.ok(saved);
        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product product){
        try {
            Product updated = productService.update(id, product);
            return ResponseEntity.ok(updated);
        } catch(IllegalArgumentException e){
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id){
        try {
            productService.delete(id);
            return ResponseEntity.ok().build();
        } catch(IllegalArgumentException e){
            return ResponseEntity.notFound().build();
        }
    }
}
