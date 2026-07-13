package com.celestials.service;

import com.celestials.model.Setting;
import com.celestials.repository.SettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Service
public class SettingService {

    private static final String SHIPPING_FEE_KEY = "shipping_fee";
    private static final BigDecimal DEFAULT_SHIPPING_FEE = new BigDecimal("20");
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("200");

    private final SettingRepository settingRepository;

    public SettingService(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public BigDecimal getShippingFee() {
        return settingRepository.findById(SHIPPING_FEE_KEY)
                .map(s -> new BigDecimal(s.getValue()))
                .orElse(DEFAULT_SHIPPING_FEE);
    }

    public BigDecimal computeShipping(BigDecimal orderTotal) {
        if (orderTotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }
        return getShippingFee();
    }

    public Map<String, Object> getPublicSettings() {
        return Map.of(
                "shippingFee", getShippingFee(),
                "freeShippingThreshold", FREE_SHIPPING_THRESHOLD
        );
    }

    @Transactional
    public void setShippingFee(BigDecimal fee) {
        if (fee == null || fee.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Taxa livrare trebuie sa fie pozitiva");
        }
        Setting s = settingRepository.findById(SHIPPING_FEE_KEY).orElse(new Setting());
        s.setKey(SHIPPING_FEE_KEY);
        s.setValue(fee.toPlainString());
        s.setUpdatedAt(OffsetDateTime.now());
        settingRepository.save(s);
    }
}
