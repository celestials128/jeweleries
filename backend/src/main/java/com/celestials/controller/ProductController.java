package com.celestials.controller;

import com.celestials.model.Product;
import com.celestials.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService){
        this.productService = productService;
    }

    @GetMapping
    public List<Product> list(){
        return productService.getAll();
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

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Product p){
        try {
            Product saved = productService.create(p);
            return ResponseEntity.ok(saved);
        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Product p){
        try {
            Product updated = productService.update(id, p);
            return ResponseEntity.ok(updated);
        } catch(IllegalArgumentException e){
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id){
        try {
            productService.delete(id);
            return ResponseEntity.ok().build();
        } catch(IllegalArgumentException e){
            return ResponseEntity.notFound().build();
        }
    }
}
