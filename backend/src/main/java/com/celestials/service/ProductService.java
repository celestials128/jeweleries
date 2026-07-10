package com.celestials.service;

import com.celestials.model.Product;
import com.celestials.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository){
        this.productRepository = productRepository;
    }

    public List<Product> getAll(){
        return productRepository.findAll();
    }

    public Product getById(Long id){
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    public Product create(Product product){
        if(product.getName() == null || product.getName().isBlank()){
            throw new IllegalArgumentException("Product name is required");
        }
        if(product.getPrice() == null || product.getPrice().signum() <= 0){
            throw new IllegalArgumentException("Product price must be positive");
        }
        if(product.getStock() == null){
            product.setStock(0);
        }
        List<String> normalizedImageUrls = normalizeImageUrls(product.getImageUrls(), product.getImageUrl());
        product.setImageUrls(normalizedImageUrls);
        product.setImageUrl(normalizedImageUrls.isEmpty() ? "" : normalizedImageUrls.get(0));
        return productRepository.save(product);
    }

    public Product update(Long id, Product productData){
        Product existing = getById(id);
        if(productData.getName() != null) existing.setName(productData.getName());
        if(productData.getDescription() != null) existing.setDescription(productData.getDescription());
        if(productData.getPrice() != null) existing.setPrice(productData.getPrice());
        if(productData.getImageUrls() != null){
            List<String> normalizedImageUrls = normalizeImageUrls(productData.getImageUrls(), productData.getImageUrl());
            existing.setImageUrls(normalizedImageUrls);
            existing.setImageUrl(normalizedImageUrls.isEmpty() ? "" : normalizedImageUrls.get(0));
        } else if(productData.getImageUrl() != null){
            List<String> normalizedImageUrls = normalizeImageUrls(null, productData.getImageUrl());
            existing.setImageUrls(normalizedImageUrls);
            existing.setImageUrl(normalizedImageUrls.isEmpty() ? "" : normalizedImageUrls.get(0));
        }
        if(productData.getStock() != null) existing.setStock(productData.getStock());
        return productRepository.save(existing);
    }

    public void delete(Long id){
        if(!productRepository.existsById(id)){
            throw new IllegalArgumentException("Product not found");
        }
        productRepository.deleteById(id);
    }

    private List<String> normalizeImageUrls(List<String> imageUrls, String fallbackImageUrl){
        List<String> normalized = new ArrayList<>();

        if(imageUrls != null){
            for(String imageUrl : imageUrls){
                if(imageUrl != null){
                    String trimmed = imageUrl.trim();
                    if(!trimmed.isEmpty() && !normalized.contains(trimmed)){
                        normalized.add(trimmed);
                    }
                }
            }
        }

        if(normalized.isEmpty() && fallbackImageUrl != null){
            String trimmedFallback = fallbackImageUrl.trim();
            if(!trimmedFallback.isEmpty()){
                normalized.add(trimmedFallback);
            }
        }

        return normalized;
    }
}
