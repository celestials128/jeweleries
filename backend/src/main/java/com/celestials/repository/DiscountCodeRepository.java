package com.celestials.repository;

import com.celestials.model.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Long> {
    Optional<DiscountCode> findByCodeIgnoreCase(String code);
    List<DiscountCode> findAllByOrderByCreatedAtDesc();
}
