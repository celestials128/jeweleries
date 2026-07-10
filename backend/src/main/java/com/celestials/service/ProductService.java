package com.celestials.service;

import com.celestials.model.Product;
import com.celestials.model.ProductType;
import com.celestials.repository.OrderItemRepository;
import com.celestials.repository.ProductRepository;
import com.celestials.repository.ProductTypeRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductTypeRepository productTypeRepository;
    private final OrderItemRepository orderItemRepository;

    public ProductService(
            ProductRepository productRepository,
            ProductTypeRepository productTypeRepository,
            OrderItemRepository orderItemRepository){
        this.productRepository = productRepository;
        this.productTypeRepository = productTypeRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public List<Product> getAll(){
        return productRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Product> getByType(String typeSlug){
        if(typeSlug == null || typeSlug.isBlank()){
            return getAll();
        }
        return productRepository.findByTypeSlugIgnoreCaseOrderByCreatedAtDesc(typeSlug.trim());
    }

    public List<Product> getPromotions(int limit){
        return take(productRepository.findByDiscountPercentGreaterThanOrderByCreatedAtDesc(BigDecimal.ZERO), limit);
    }

    public List<Product> getHandmade(int limit){
        return take(productRepository.findByHandmadeTrueOrderByCreatedAtDesc(), limit);
    }

    public List<Product> getPopular(int limit){
        Set<Long> selectedIds = new LinkedHashSet<>();

        List<Product> manuallyPopular = productRepository.findByPopularTrueOrderByCreatedAtDesc();
        for(Product product : manuallyPopular){
            if(product.getId() != null){
                selectedIds.add(product.getId());
            }
        }

        if(limit > 0 && selectedIds.size() < limit){
            List<OrderItemRepository.ProductPopularityView> ranked = orderItemRepository.findMostOrderedProductIds(
                PageRequest.of(0, Math.max(limit, 12))
            );
            for(OrderItemRepository.ProductPopularityView row : ranked){
                if(row.getProductId() != null){
                    selectedIds.add(row.getProductId());
                    if(selectedIds.size() >= limit){
                        break;
                    }
                }
            }
        }

        if(selectedIds.isEmpty()){
            return List.of();
        }

        List<Product> result = new ArrayList<>();
        Map<Long, Product> lookup = new LinkedHashMap<>();
        for(Product product : productRepository.findAllById(selectedIds)){
            lookup.put(product.getId(), product);
        }
        for(Long id : selectedIds){
            Product product = lookup.get(id);
            if(product != null){
                result.add(product);
            }
            if(limit > 0 && result.size() >= limit){
                break;
            }
        }

        return result;
    }

    public Map<String, List<Product>> getNewArrivalsByType(int perType){
        int safePerType = perType <= 0 ? 3 : Math.min(perType, 6);
        Map<String, List<Product>> result = new LinkedHashMap<>();

        for(ProductType productType : productTypeRepository.findAllByOrderByNameAsc()){
            if(productType.getId() == null){
                continue;
            }
            List<Product> products = productRepository.findByTypeIdOrderByCreatedAtDesc(
                productType.getId(),
                PageRequest.of(0, safePerType)
            );
            result.put(productType.getName(), products);
        }

        return result;
    }

    public Product getById(Long id){
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    public Product create(Product product){
        validateInput(product, true);
        applyDefaultsAndNormalization(product);
        return productRepository.save(product);
    }

    public Product update(Long id, Product productData){
        Product existing = getById(id);
        if(productData.getName() != null) existing.setName(productData.getName());
        if(productData.getDescription() != null) existing.setDescription(productData.getDescription());
        if(productData.getPrice() != null) existing.setPrice(productData.getPrice());
        if(productData.getType() != null && productData.getType().getId() != null){
            ProductType type = productTypeRepository.findById(productData.getType().getId())
                .orElseThrow(() -> new IllegalArgumentException("Product type not found"));
            existing.setType(type);
        }
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
        if(productData.getDiscountPercent() != null) existing.setDiscountPercent(productData.getDiscountPercent());
        if(productData.getHandmade() != null) existing.setHandmade(productData.getHandmade());
        if(productData.getPopular() != null) existing.setPopular(productData.getPopular());

        validateInput(existing, false);
        applyDefaultsAndNormalization(existing);
        return productRepository.save(existing);
    }

    public void delete(Long id){
        if(!productRepository.existsById(id)){
            throw new IllegalArgumentException("Product not found");
        }
        productRepository.deleteById(id);
    }

    private void validateInput(Product product, boolean create){
        if(product.getName() == null || product.getName().isBlank()){
            throw new IllegalArgumentException("Product name is required");
        }
        if(product.getPrice() == null || product.getPrice().signum() <= 0){
            throw new IllegalArgumentException("Product price must be positive");
        }
        if(product.getStock() != null && product.getStock() < 0){
            throw new IllegalArgumentException("Product stock cannot be negative");
        }
        if(product.getType() == null || product.getType().getId() == null){
            throw new IllegalArgumentException("Product type is required");
        }

        ProductType dbType = productTypeRepository.findById(product.getType().getId())
            .orElseThrow(() -> new IllegalArgumentException("Product type not found"));
        product.setType(dbType);

        BigDecimal discount = product.getDiscountPercent() == null ? BigDecimal.ZERO : product.getDiscountPercent();
        if(discount.compareTo(BigDecimal.ZERO) < 0 || discount.compareTo(BigDecimal.valueOf(100)) >= 0){
            throw new IllegalArgumentException("Discount percent must be between 0 and 99.99");
        }
    }

    private void applyDefaultsAndNormalization(Product product){
        if(product.getStock() == null){
            product.setStock(0);
        }
        if(product.getDiscountPercent() == null){
            product.setDiscountPercent(BigDecimal.ZERO);
        } else {
            product.setDiscountPercent(product.getDiscountPercent().setScale(2, RoundingMode.HALF_UP));
        }
        if(product.getHandmade() == null){
            product.setHandmade(false);
        }
        if(product.getPopular() == null){
            product.setPopular(false);
        }
        List<String> normalizedImageUrls = normalizeImageUrls(product.getImageUrls(), product.getImageUrl());
        product.setImageUrls(normalizedImageUrls);
        product.setImageUrl(normalizedImageUrls.isEmpty() ? "" : normalizedImageUrls.get(0));
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

    private List<Product> take(List<Product> products, int limit){
        if(limit <= 0 || products.size() <= limit){
            return products;
        }
        return products.subList(0, limit);
    }
}
