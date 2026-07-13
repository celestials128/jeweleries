package com.celestials.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String token;
    @Column(nullable = false)
    private String username;
    @Column(nullable = false)
    private OffsetDateTime expiresAt;
    private boolean used = false;
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getToken(){return token;} public void setToken(String token){this.token=token;}
    public String getUsername(){return username;} public void setUsername(String username){this.username=username;}
    public OffsetDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(OffsetDateTime expiresAt){this.expiresAt=expiresAt;}
    public boolean isUsed(){return used;} public void setUsed(boolean used){this.used=used;}
    public OffsetDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(OffsetDateTime createdAt){this.createdAt=createdAt;}
}
