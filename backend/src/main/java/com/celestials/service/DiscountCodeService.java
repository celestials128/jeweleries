package com.celestials.service;

import com.celestials.model.DiscountCode;
import com.celestials.model.User;
import com.celestials.repository.DiscountCodeRepository;
import com.celestials.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
public class DiscountCodeService {

    private final DiscountCodeRepository discountCodeRepository;
    private final UserRepository userRepository;

    public DiscountCodeService(DiscountCodeRepository discountCodeRepository, UserRepository userRepository) {
        this.discountCodeRepository = discountCodeRepository;
        this.userRepository = userRepository;
    }

    public List<DiscountCode> getAll() {
        return discountCodeRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public DiscountCode create(Map<String, Object> body) {
        String code = ((String) body.getOrDefault("code", "")).trim().toUpperCase();
        if (!StringUtils.hasText(code)) throw new IllegalArgumentException("Codul nu poate fi gol");
        if (discountCodeRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new IllegalArgumentException("Codul exista deja");
        }

        String type = ((String) body.getOrDefault("type", "PERCENTAGE")).trim().toUpperCase();
        if (!"PERCENTAGE".equals(type) && !"FIXED".equals(type)) {
            throw new IllegalArgumentException("Tipul trebuie sa fie PERCENTAGE sau FIXED");
        }

        BigDecimal value = new BigDecimal(body.getOrDefault("value", "0").toString());
        if (value.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("Valoarea trebuie sa fie pozitiva");
        if ("PERCENTAGE".equals(type) && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Procentul nu poate depasi 100");
        }

        DiscountCode dc = new DiscountCode();
        dc.setCode(code);
        dc.setType(type);
        dc.setValue(value);
        String assignedUsername = body.containsKey("assignedUsername") && body.get("assignedUsername") != null
                ? ((String) body.get("assignedUsername")).trim() : null;
        dc.setAssignedUsername(StringUtils.hasText(assignedUsername) ? assignedUsername : null);
        if (body.containsKey("maxUses") && body.get("maxUses") != null) {
            dc.setMaxUses(Integer.parseInt(body.get("maxUses").toString()));
        }
        if (body.containsKey("expiresAt") && StringUtils.hasText((String) body.get("expiresAt"))) {
            dc.setExpiresAt(OffsetDateTime.parse((String) body.get("expiresAt")));
        }
        dc.setActive(true);
        return discountCodeRepository.save(dc);
    }

    @Transactional
    public void delete(Long id) {
        discountCodeRepository.deleteById(id);
    }

    @Transactional
    public DiscountCode toggleActive(Long id) {
        DiscountCode dc = discountCodeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Codul nu a fost gasit"));
        dc.setActive(!dc.isActive());
        return discountCodeRepository.save(dc);
    }

    /**
     * Validates a discount code and returns the discount amount for the given order total.
     * Does NOT increment usedCount — that happens when the order is actually placed.
     */
    public Map<String, Object> validate(String code, BigDecimal orderTotal, String username) {
        DiscountCode dc = discountCodeRepository.findByCodeIgnoreCase(code)
            .orElseThrow(() -> new IllegalArgumentException("Codul de discount nu este valid"));

        if (!dc.isActive()) throw new IllegalArgumentException("Codul nu mai este activ");
        if (dc.getExpiresAt() != null && dc.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Codul a expirat");
        }
        if (dc.getMaxUses() != null && dc.getUsedCount() >= dc.getMaxUses()) {
            throw new IllegalArgumentException("Codul a atins numarul maxim de utilizari");
        }
        if (!isDiscountAllowedForUser(dc, username)) {
            throw new IllegalArgumentException("Codul nu este valabil pentru acest cont");
        }

        BigDecimal discountAmount;
        if ("PERCENTAGE".equals(dc.getType())) {
            discountAmount = orderTotal.multiply(dc.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = dc.getValue().min(orderTotal);
        }

        return Map.of(
            "valid", true,
            "code", dc.getCode(),
            "type", dc.getType(),
            "value", dc.getValue(),
            "discountAmount", discountAmount
        );
    }

    /**
     * Applies a discount code (increments usedCount). Called when order is created.
     */
    @Transactional
    public BigDecimal applyCode(String code, BigDecimal orderTotal, String username) {
        if (!StringUtils.hasText(code)) return BigDecimal.ZERO;
        DiscountCode dc = discountCodeRepository.findByCodeIgnoreCase(code).orElse(null);
        if (dc == null || !dc.isActive()) return BigDecimal.ZERO;
        if (dc.getExpiresAt() != null && dc.getExpiresAt().isBefore(OffsetDateTime.now())) return BigDecimal.ZERO;
        if (dc.getMaxUses() != null && dc.getUsedCount() >= dc.getMaxUses()) return BigDecimal.ZERO;
        if (!isDiscountAllowedForUser(dc, username)) return BigDecimal.ZERO;

        dc.setUsedCount(dc.getUsedCount() + 1);
        discountCodeRepository.save(dc);

        if ("PERCENTAGE".equals(dc.getType())) {
            return orderTotal.multiply(dc.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            return dc.getValue().min(orderTotal);
        }
    }

    private boolean isDiscountAllowedForUser(DiscountCode dc, String usernameOrEmail) {
        String assigned = dc.getAssignedUsername();
        if (!StringUtils.hasText(assigned)) return true;
        if (!StringUtils.hasText(usernameOrEmail)) return false;

        String normalizedIdentifier = usernameOrEmail.trim();
        if (assigned.equalsIgnoreCase(normalizedIdentifier)) return true;

        User user = userRepository.findByUsername(normalizedIdentifier)
                .or(() -> userRepository.findByEmail(normalizedIdentifier))
                .orElse(null);
        if (user == null) return false;

        return assigned.equalsIgnoreCase(user.getUsername())
                || (StringUtils.hasText(user.getEmail()) && assigned.equalsIgnoreCase(user.getEmail()));
    }
}
