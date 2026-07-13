package com.celestials.model;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // ROLE_CUSTOMER, ROLE_ADMIN

    @Column
    private String email;

    public User() {}

    public User(String username, String password, String role){
        this.username = username;
        this.password = password;
        this.role = role;
    }

    // getters/setters
    public Long getId(){return id;} public void setId(Long id){this.id = id;}
    public String getUsername(){return username;} public void setUsername(String username){this.username = username;}
    public String getPassword(){return password;} public void setPassword(String password){this.password = password;}
    public String getRole(){return role;} public void setRole(String role){this.role = role;}
    public String getEmail(){return email;} public void setEmail(String email){this.email = email;}

    @Override
    public boolean equals(Object o){
        if(this == o) return true; if(!(o instanceof User)) return false; User u = (User)o; return Objects.equals(id,u.id);
    }
    @Override
    public int hashCode(){ return Objects.hashCode(id); }
}
