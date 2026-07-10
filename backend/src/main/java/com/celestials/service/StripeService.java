package com.celestials.service;

import com.celestials.model.Order;
import com.celestials.model.Product;
import com.celestials.model.User;
import com.celestials.repository.ProductRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StripeService {

    private final ProductRepository productRepository;
    private final OrderService orderService;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    public StripeService(ProductRepository productRepository, OrderService orderService){
        this.productRepository = productRepository;
        this.orderService = orderService;
    }

    public Map<String, Object> createCheckoutPaymentIntent(List<Map<String, Object>> items, User user){
        if(stripeSecretKey == null || stripeSecretKey.isBlank()){
            throw new IllegalStateException("Stripe secret key is not configured");
        }
        if(items == null || items.isEmpty()){
            throw new IllegalArgumentException("Order must contain items");
        }

        BigDecimal total = calculateTotalFromCatalog(items);
        long amountCents = total.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
        if(amountCents <= 0){
            throw new IllegalArgumentException("Amount must be positive");
        }

        Stripe.apiKey = stripeSecretKey;

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountCents)
                    .setCurrency("usd")
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            Map<String, Object> result = new HashMap<>();
            result.put("clientSecret", intent.getClientSecret());

            if(user != null){
                Order order = orderService.createPendingOrder(items, user, intent.getId());
                result.put("orderId", order.getId());
            }

            return result;
        } catch (Exception e){
            throw new RuntimeException("Failed to create Stripe payment intent: " + e.getMessage(), e);
        }
    }

    public void handleWebhookEvent(String payload, String signatureHeader){
        if(stripeWebhookSecret == null || stripeWebhookSecret.isBlank()){
            throw new IllegalStateException("Stripe webhook secret is not configured");
        }
        if(signatureHeader == null || signatureHeader.isBlank()){
            throw new IllegalArgumentException("Missing Stripe-Signature header");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException e){
            throw new IllegalArgumentException("Invalid Stripe webhook signature", e);
        }

        PaymentIntent paymentIntent = extractPaymentIntent(event);
        String paymentIntentId = paymentIntent.getId();

        switch (event.getType()){
            case "payment_intent.succeeded":
                orderService.markPaidByPaymentIntent(paymentIntentId);
                break;
            case "payment_intent.payment_failed":
                orderService.markFailedByPaymentIntent(paymentIntentId);
                break;
            case "payment_intent.canceled":
                orderService.markCanceledByPaymentIntent(paymentIntentId);
                break;
            default:
                break;
        }
    }

    private PaymentIntent extractPaymentIntent(Event event){
        return (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported Stripe event payload"));
    }

    private BigDecimal calculateTotalFromCatalog(List<Map<String, Object>> items){
        BigDecimal total = BigDecimal.ZERO;

        for(Map<String, Object> item : items){
            if(item == null){
                throw new IllegalArgumentException("Invalid order item");
            }

            Object productIdValue = item.get("productId");
            Object quantityValue = item.get("quantity");
            if(!(productIdValue instanceof Number) || !(quantityValue instanceof Number)){
                throw new IllegalArgumentException("Order item must include numeric productId and quantity");
            }

            long productId = ((Number) productIdValue).longValue();
            int quantity = ((Number) quantityValue).intValue();
            if(quantity <= 0){
                throw new IllegalArgumentException("Quantity must be positive");
            }

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

            int stock = product.getStock() == null ? 0 : product.getStock();
            if(stock < quantity){
                throw new IllegalArgumentException("Insufficient stock for " + product.getName());
            }

            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        }

        return total;
    }
}
