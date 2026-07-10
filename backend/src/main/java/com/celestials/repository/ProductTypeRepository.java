package com.celestials.repository;

import com.celestials.model.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {
    List<ProductType> findAllByOrderByNameAsc();
    Optional<ProductType> findBySlugIgnoreCase(String slug);
    boolean existsByNameIgnoreCase(String name);
    boolean existsBySlugIgnoreCase(String slug);
}
