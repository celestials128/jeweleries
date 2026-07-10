package com.celestials.dev;

import com.celestials.model.User;
import com.celestials.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevDataLoader implements CommandLineRunner {

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
        }
    }
}
