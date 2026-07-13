package com.celestials.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "settings")
public class Setting {
    @Id
    private String key;
    @Column(nullable = false)
    private String value;
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
