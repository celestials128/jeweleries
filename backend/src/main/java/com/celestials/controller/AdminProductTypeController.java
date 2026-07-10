package com.celestials.controller;

import com.celestials.model.ProductType;
import com.celestials.service.ProductTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/product-types")
public class AdminProductTypeController {

    private final ProductTypeService productTypeService;

    public AdminProductTypeController(ProductTypeService productTypeService) {
        this.productTypeService = productTypeService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProductType> list() {
        return productTypeService.getAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@RequestBody ProductType payload) {
        try {
            return ResponseEntity.ok(productTypeService.create(payload));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProductType payload) {
        try {
            return ResponseEntity.ok(productTypeService.update(id, payload));
        } catch (IllegalArgumentException ex) {
            String msg = ex.getMessage();
            if ("Category not found".equals(msg)) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            productTypeService.delete(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            String msg = ex.getMessage();
            if ("Category not found".equals(msg)) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }
}
