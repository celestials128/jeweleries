package com.celestials.repository;

import com.celestials.model.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByOrderByCreatedAtDesc();
    List<Product> findByTypeSlugIgnoreCaseOrderByCreatedAtDesc(String slug);
    List<Product> findByTypeIdOrderByCreatedAtDesc(Long typeId, Pageable pageable);
    List<Product> findByDiscountPercentGreaterThanOrderByCreatedAtDesc(BigDecimal discountPercent);
    List<Product> findByHandmadeTrueOrderByCreatedAtDesc();
    List<Product> findByPopularTrueOrderByCreatedAtDesc();
    long countByTypeId(Long typeId);
}
