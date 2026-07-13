package com.celestials.service;

import com.celestials.model.PasswordResetToken;
import com.celestials.model.User;
import com.celestials.repository.PasswordResetTokenRepository;
import com.celestials.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       PasswordResetTokenRepository passwordResetTokenRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    @Transactional
    public Map<String, String> register(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username already taken");
        }
        User user = new User(username, passwordEncoder.encode(password), "ROLE_CUSTOMER");
        if (StringUtils.hasText(username) && username.contains("@")) {
            user.setEmail(username);
        }
        userRepository.save(user);
        String emailAddr = resolveEmail(user);
        if (StringUtils.hasText(emailAddr)) {
            try { emailService.sendWelcomeEmail(emailAddr, username); } catch (Exception ignored) {}
        }
        return Map.of("username", user.getUsername());
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public void changePassword(String username, String currentPassword, String newPassword) {
        if (username == null || username.isBlank()) throw new IllegalArgumentException("User not found");
        if (newPassword == null || newPassword.trim().length() < 6) throw new IllegalArgumentException("Password must be at least 6 characters");
        User user = findByUsername(username);
        if (currentPassword == null || !validatePassword(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("invalid_credentials");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(String usernameOrEmail) {
        if (!StringUtils.hasText(usernameOrEmail)) return;
        User user = userRepository.findByUsername(usernameOrEmail.trim())
            .or(() -> userRepository.findByEmail(usernameOrEmail.trim()))
            .orElse(null);
        if (user == null) return;

        String emailAddr = resolveEmail(user);
        if (!StringUtils.hasText(emailAddr)) return;

        passwordResetTokenRepository.deleteByUsername(user.getUsername());

        String token = UUID.randomUUID().toString();
        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(token);
        prt.setUsername(user.getUsername());
        prt.setExpiresAt(OffsetDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(prt);

        emailService.sendPasswordResetEmail(emailAddr, token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (!StringUtils.hasText(token)) throw new IllegalArgumentException("Token invalid");
        if (newPassword == null || newPassword.trim().length() < 6) throw new IllegalArgumentException("Password must be at least 6 characters");

        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Token invalid sau expirat"));

        if (prt.isUsed()) throw new IllegalArgumentException("Token-ul a fost deja folosit");
        if (prt.getExpiresAt().isBefore(OffsetDateTime.now())) throw new IllegalArgumentException("Token-ul a expirat");

        User user = findByUsername(prt.getUsername());
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);
    }

    private String resolveEmail(User user) {
        if (StringUtils.hasText(user.getEmail())) return user.getEmail();
        if (user.getUsername() != null && user.getUsername().contains("@")) return user.getUsername();
        return null;
    }
}

