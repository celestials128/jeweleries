package com.celestials.service;

import com.celestials.model.ProductType;
import com.celestials.repository.ProductRepository;
import com.celestials.repository.ProductTypeRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;

@Service
public class ProductTypeService {

    private final ProductTypeRepository productTypeRepository;
    private final ProductRepository productRepository;

    public ProductTypeService(ProductTypeRepository productTypeRepository, ProductRepository productRepository) {
        this.productTypeRepository = productTypeRepository;
        this.productRepository = productRepository;
    }

    public List<ProductType> getAll() {
        return productTypeRepository.findAllByOrderByNameAsc();
    }

    public ProductType create(ProductType payload) {
        String name = normalizeName(payload.getName());
        String slug = slugify(name);

        if (productTypeRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category name already exists");
        }
        if (productTypeRepository.existsBySlugIgnoreCase(slug)) {
            throw new IllegalArgumentException("Category slug already exists");
        }

        ProductType entity = new ProductType(name, slug);
        if (payload.getDescription() != null) entity.setDescription(payload.getDescription().trim());
        return productTypeRepository.save(entity);
    }

    public ProductType update(Long id, ProductType payload) {
        ProductType existing = productTypeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        String name = normalizeName(payload.getName());
        String slug = slugify(name);

        if (!existing.getName().equalsIgnoreCase(name) && productTypeRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category name already exists");
        }
        if (!existing.getSlug().equalsIgnoreCase(slug) && productTypeRepository.existsBySlugIgnoreCase(slug)) {
            throw new IllegalArgumentException("Category slug already exists");
        }

        existing.setName(name);
        existing.setSlug(slug);
        if (payload.getDescription() != null) existing.setDescription(payload.getDescription().trim());
        return productTypeRepository.save(existing);
    }

    public void delete(Long id) {
        ProductType existing = productTypeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (productRepository.countByTypeId(existing.getId()) > 0) {
            throw new IllegalArgumentException("Cannot delete category because it is assigned to products");
        }
        productTypeRepository.delete(existing);
    }

    private String normalizeName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }
        return value.trim();
    }

    private String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Category name is invalid");
        }
        return normalized;
    }
}
