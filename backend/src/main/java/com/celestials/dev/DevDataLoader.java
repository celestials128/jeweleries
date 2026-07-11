package com.celestials.dev;

import com.celestials.model.User;
import com.celestials.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DevDataLoader implements CommandLineRunner {

    private static final String ADMIN_PASSWORD_PLACEHOLDER = "$2a$10$placeholderhash";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository; this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if(userRepository.findByUsername("admin").isEmpty()){
            User admin = new User("admin", passwordEncoder.encode("admin"), "ROLE_ADMIN");
            userRepository.save(admin);
            System.out.println("Created dev admin user: admin/admin");
            return;
        }

        User admin = userRepository.findByUsername("admin").orElse(null);
        if(admin != null && ADMIN_PASSWORD_PLACEHOLDER.equals(admin.getPassword())){
            admin.setPassword(passwordEncoder.encode("admin"));
            admin.setRole("ROLE_ADMIN");
            userRepository.save(admin);
            System.out.println("Repaired admin user password hash to admin/admin");
        }
    }
}
