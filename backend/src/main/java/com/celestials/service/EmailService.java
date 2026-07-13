package com.celestials.service;

import com.celestials.model.Order;
import com.celestials.model.OrderItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@celestials.ro}")
    private String from;

    @Value("${app.mail.base-url:http://localhost:3000}")
    private String baseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendWelcomeEmail(String toEmail, String username) {
        if (!isValidEmail(toEmail)) return;
        try {
            send(toEmail, "Bine ai venit la Celestials! ✨", buildWelcomeHtml(username));
        } catch (Exception ignored) {}
    }

    public void sendOrderConfirmationEmail(String toEmail, Order order) {
        if (!isValidEmail(toEmail)) return;
        try {
            send(toEmail, "Confirmarea comenzii #" + order.getId() + " - Celestials",
                buildOrderConfirmationHtml(order));
        } catch (Exception ignored) {}
    }

    public void sendOrderStatusUpdateEmail(String toEmail, Order order) {
        if (!isValidEmail(toEmail)) return;
        try {
            String statusLabel = translateStatus(order.getStatus());
            send(toEmail, "Comanda #" + order.getId() + " - " + statusLabel,
                buildOrderStatusHtml(order));
        } catch (Exception ignored) {}
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        if (!isValidEmail(toEmail)) return;
        try {
            String resetUrl = baseUrl + "/reset-password?token=" + resetToken;
            send(toEmail, "Resetare parola - Celestials", buildPasswordResetHtml(resetUrl));
        } catch (Exception ignored) {}
    }

    private void send(String to, String subject, String html) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private boolean isValidEmail(String email) {
        return StringUtils.hasText(email) && email.contains("@") && email.contains(".");
    }

    private String translateStatus(String status) {
        if (status == null) return "Actualizata";
        return switch (status) {
            case "PAID" -> "Platita";
            case "SHIPPED" -> "Expediata";
            case "DELIVERED" -> "Livrata";
            case "CANCELLED" -> "Anulata";
            case "AWAITING_CASH_ON_DELIVERY" -> "In asteptare (ramburs)";
            default -> status;
        };
    }

    private String buildWelcomeHtml(String username) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#1a2332">Bine ai venit la Celestials! ✨</h2>
              <p>Salut <strong>%s</strong>,</p>
              <p>Contul tau a fost creat cu succes. Acum poti plasa comenzi si urmari statusul lor.</p>
              <p style="margin-top:32px"><a href="%s/products" style="background:#1a2332;color:white;padding:12px 24px;text-decoration:none;border-radius:4px">Descopera bijuteriile</a></p>
              <p style="color:#888;margin-top:32px;font-size:12px">Celestials &mdash; bijuterii cu suflet</p>
            </div>
            """.formatted(username, baseUrl);
    }

    private String buildOrderConfirmationHtml(Order order) {
        StringBuilder itemsHtml = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            String name = item.getProduct() != null ? item.getProduct().getName() : "Produs";
            BigDecimal lineTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            itemsHtml.append("<tr><td style='padding:4px 8px'>%s</td><td style='padding:4px 8px;text-align:center'>x%d</td><td style='padding:4px 8px;text-align:right'>%s RON</td></tr>"
                .formatted(name, item.getQuantity(), lineTotal.toPlainString()));
        }
        BigDecimal discountAmt = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        String discountRow = discountAmt.compareTo(BigDecimal.ZERO) > 0
            ? "<tr><td colspan='2' style='padding:4px 8px;color:green'>Discount (%s)</td><td style='padding:4px 8px;text-align:right;color:green'>-%s RON</td></tr>".formatted(order.getDiscountCode(), discountAmt.toPlainString())
            : "";
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#1a2332">Comanda ta #%d a fost inregistrata! ✨</h2>
              <p>Iti multumim pentru comanda. Vom procesa cererea ta cat mai curand.</p>
              <table style="width:100%%;border-collapse:collapse;margin:16px 0">
                <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Produs</th><th style="padding:8px">Cant.</th><th style="padding:8px;text-align:right">Pret</th></tr></thead>
                <tbody>%s%s</tbody>
                <tfoot><tr><td colspan='2' style='padding:8px;font-weight:bold'>Total</td><td style='padding:8px;text-align:right;font-weight:bold'>%s RON</td></tr></tfoot>
              </table>
              <p style="color:#888;margin-top:32px;font-size:12px">Celestials &mdash; bijuterii cu suflet</p>
            </div>
            """.formatted(order.getId(), itemsHtml, discountRow, order.getTotal().setScale(2, RoundingMode.HALF_UP).toPlainString());
    }

    private String buildOrderStatusHtml(Order order) {
        String statusLabel = translateStatus(order.getStatus());
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#1a2332">Update comanda #%d</h2>
              <p>Statusul comenzii tale a fost actualizat la: <strong>%s</strong></p>
              <p style="margin-top:32px"><a href="%s/orders" style="background:#1a2332;color:white;padding:12px 24px;text-decoration:none;border-radius:4px">Vezi comenzile mele</a></p>
              <p style="color:#888;margin-top:32px;font-size:12px">Celestials &mdash; bijuterii cu suflet</p>
            </div>
            """.formatted(order.getId(), statusLabel, baseUrl);
    }

    private String buildPasswordResetHtml(String resetUrl) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#1a2332">Resetare parola - Celestials</h2>
              <p>Ai solicitat resetarea parolei. Apasa butonul de mai jos. Link-ul este valabil 1 ora.</p>
              <p style="margin-top:32px"><a href="%s" style="background:#1a2332;color:white;padding:12px 24px;text-decoration:none;border-radius:4px">Reseteaza parola</a></p>
              <p style="color:#888;margin-top:16px">Daca nu ai solicitat aceasta actiune, ignora acest email.</p>
              <p style="color:#888;margin-top:32px;font-size:12px">Celestials &mdash; bijuterii cu suflet</p>
            </div>
            """.formatted(resetUrl);
    }
}
