package com.celestials.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "discount_codes")
public class DiscountCode {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String code;
    @Column(nullable = false)
    private String type; // PERCENTAGE or FIXED
    @Column(nullable = false)
    private BigDecimal value;
    private String assignedUsername;
    private Integer maxUses;
    private Integer usedCount = 0;
    private OffsetDateTime expiresAt;
    private boolean active = true;
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getCode(){return code;} public void setCode(String code){this.code=code;}
    public String getType(){return type;} public void setType(String type){this.type=type;}
    public BigDecimal getValue(){return value;} public void setValue(BigDecimal value){this.value=value;}
    public String getAssignedUsername(){return assignedUsername;} public void setAssignedUsername(String assignedUsername){this.assignedUsername=assignedUsername;}
    public Integer getMaxUses(){return maxUses;} public void setMaxUses(Integer maxUses){this.maxUses=maxUses;}
    public Integer getUsedCount(){return usedCount;} public void setUsedCount(Integer usedCount){this.usedCount=usedCount;}
    public OffsetDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(OffsetDateTime expiresAt){this.expiresAt=expiresAt;}
    public boolean isActive(){return active;} public void setActive(boolean active){this.active=active;}
    public OffsetDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
