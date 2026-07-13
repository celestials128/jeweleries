package com.celestials.service;

import com.celestials.dto.StripeCheckoutRequest;
import com.celestials.dto.StripeCheckoutResponse;
import com.celestials.model.Order;
import com.celestials.model.OrderItem;
import com.celestials.model.User;
import com.stripe.StripeClient;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class StripePaymentService {

    private final OrderService orderService;

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${stripe.success-url:http://localhost:3000/orders?payment=success}")
    private String defaultSuccessUrl;

    @Value("${stripe.cancel-url:http://localhost:3000/checkout?payment=cancelled}")
    private String defaultCancelUrl;

    @Value("${stripe.currency:RON}")
    private String currency;

    public StripePaymentService(OrderService orderService) {
        this.orderService = orderService;
    }

    public boolean isConfigured() {
        return StringUtils.hasText(secretKey);
    }

    public Map<String, Object> getStatus() {
        return Map.of(
                "configured", isConfigured(),
                "secretKeyConfigured", StringUtils.hasText(secretKey),
                "webhookSecretConfigured", StringUtils.hasText(webhookSecret)
        );
    }

    @Transactional
    public StripeCheckoutResponse createCheckout(StripeCheckoutRequest request, User user) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Order must contain items");
        }
        if (!isConfigured()) {
            throw new IllegalStateException("Stripe secret key is not configured");
        }

        Order order = orderService.createPendingOrder(request.items(), user);
        String paymentReference = order.getPaymentReference();

        String successUrl = StringUtils.hasText(request.successUrl()) ? request.successUrl() : defaultSuccessUrl;
        String cancelUrl = StringUtils.hasText(request.cancelUrl()) ? request.cancelUrl() : defaultCancelUrl;

        try {
            StripeClient client = new StripeClient(secretKey);

            List<SessionCreateParams.LineItem> lineItems = buildLineItems(order);

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl + (successUrl.contains("?") ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(cancelUrl)
                    .addAllLineItem(lineItems)
                    .putMetadata("paymentReference", paymentReference)
                    .putMetadata("orderId", String.valueOf(order.getId()))
                    .build();

            Session session = client.v1().checkout().sessions().create(params);

            return new StripeCheckoutResponse(
                    session.getId(),
                    session.getUrl(),
                    order.getId(),
                    paymentReference
            );
        } catch (StripeException ex) {
            throw new IllegalStateException("Failed to create Stripe checkout session: " + ex.getMessage(), ex);
        }
    }

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        if (!StringUtils.hasText(payload)) {
            return;
        }

        Event event;
        try {
            if (StringUtils.hasText(webhookSecret) && StringUtils.hasText(sigHeader)) {
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            } else {
                // No webhook secret configured — skip signature verification (dev only)
                event = Event.GSON.fromJson(payload, Event.class);
            }
        } catch (SignatureVerificationException ex) {
            throw new IllegalArgumentException("Invalid Stripe webhook signature", ex);
        }

        processEvent(event);
    }

    private void processEvent(Event event) {
        String paymentReference = extractPaymentReference(event);
        if (!StringUtils.hasText(paymentReference)) {
            return;
        }

        switch (event.getType()) {
            case "checkout.session.completed" -> orderService.markPaidByPaymentReference(paymentReference);
            case "checkout.session.expired" -> orderService.markFailedByPaymentReference(paymentReference);
            default -> { /* ignore unhandled event types */ }
        }
    }

    private String extractPaymentReference(Event event) {
        StripeObject stripeObject = event.getDataObjectDeserializer()
                .getObject()
                .orElse(null);

        if (stripeObject instanceof Session session) {
            Map<String, String> metadata = session.getMetadata();
            if (metadata != null) {
                return metadata.get("paymentReference");
            }
        }
        return null;
    }

    private List<SessionCreateParams.LineItem> buildLineItems(Order order) {
        List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();

        for (OrderItem item : order.getItems()) {
            BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
            // Stripe expects amounts in the smallest currency unit (bani for RON, cents for EUR/USD)
            long unitAmountInSmallestUnit = unitPrice
                    .setScale(2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .longValue();

            String productName = item.getProduct() != null && StringUtils.hasText(item.getProduct().getName())
                    ? item.getProduct().getName()
                    : "Product";

            lineItems.add(SessionCreateParams.LineItem.builder()
                    .setQuantity((long) (item.getQuantity() != null ? item.getQuantity() : 1))
                    .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(currency.toLowerCase())
                                    .setUnitAmount(unitAmountInSmallestUnit)
                                    .setProductData(
                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                    .setName(productName)
                                                    .build()
                                    )
                                    .build()
                    )
                    .build());
        }

        return lineItems;
    }
}
