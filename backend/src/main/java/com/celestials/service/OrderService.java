package com.celestials.service;

import com.celestials.model.Order;
import com.celestials.model.OrderItem;
import com.celestials.model.Product;
import com.celestials.model.User;
import com.celestials.repository.OrderRepository;
import com.celestials.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;
    private final DiscountCodeService discountCodeService;
    private final SettingService settingService;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                        EmailService emailService, DiscountCodeService discountCodeService,
                        SettingService settingService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.emailService = emailService;
        this.discountCodeService = discountCodeService;
        this.settingService = settingService;
    }

    public List<Order> getUserOrders(User user){
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public Order getOrder(Long orderId, User user){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if(!order.getUser().getId().equals(user.getId())){
            throw new IllegalArgumentException("Unauthorized");
        }
        return order;
    }

    @Transactional
    public Order createOrder(List<Map<String,Object>> items, User user){
        return createOrder(items, user, "CASH_ON_DELIVERY", null);
    }

    @Transactional
    public Order createOrder(List<Map<String,Object>> items, User user, String paymentMethod){
        return createOrder(items, user, paymentMethod, null);
    }

    @Transactional
    public Order createOrder(List<Map<String,Object>> items, User user, String paymentMethod, String discountCode){
        Order order = buildOrder(items, user);
        String normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
        order.setPaymentMethod(normalizedPaymentMethod);
        if ("CASH_ON_DELIVERY".equals(normalizedPaymentMethod)) {
            order.setStatus("AWAITING_CASH_ON_DELIVERY");
        } else {
            order.setStatus("CREATED");
        }
        applyDiscount(order, discountCode, user);
        order = orderRepository.save(order);
        sendOrderConfirmationEmail(order, user);
        return order;
    }

    @Transactional
    public Order createPendingOrder(List<Map<String,Object>> items, User user){
        return createPendingOrder(items, user, null);
    }

    @Transactional
    public Order createPendingOrder(List<Map<String,Object>> items, User user, String discountCode){
        Order order = buildOrder(items, user);
        order.setStatus("PENDING_PAYMENT");
        order.setPaymentMethod("CARD_ONLINE");
        applyDiscount(order, discountCode, user);
        order = orderRepository.save(order);
        order.setPaymentReference(String.valueOf(order.getId()));
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateStatus(Long orderId, String newStatus){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        order.setStatus(normalizeStatus(newStatus));
        order = orderRepository.save(order);
        sendStatusEmail(order);
        return order;
    }

    @Transactional
    public Order updateStatusForUser(Long orderId, String newStatus, User user, boolean adminOverride){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if(!adminOverride && (user == null || order.getUser() == null || !order.getUser().getId().equals(user.getId()))){
            throw new IllegalArgumentException("Unauthorized");
        }

        if(adminOverride && order.getUser() == null){
            order.setUser(null);
        }

        String normalizedStatus = normalizeStatus(newStatus);
        if(!adminOverride && !"CANCELLED".equals(normalizedStatus)){
            throw new IllegalArgumentException("ForbiddenStatus");
        }

        order.setStatus(normalizedStatus);
        order = orderRepository.save(order);
        sendStatusEmail(order);
        return order;
    }

    @Transactional
    public void markPaidByPaymentReference(String paymentReference){
        if(paymentReference == null || paymentReference.isBlank()) return;

        Order order = orderRepository.findByPaymentReference(paymentReference).orElse(null);
        if(order == null) return;
        if("PAID".equalsIgnoreCase(order.getStatus())) return;

        for(OrderItem item : order.getItems()){
            Product product = item.getProduct();
            int currentStock = product.getStock() == null ? 0 : product.getStock();
            int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
            if(quantity <= 0) throw new IllegalStateException("Invalid quantity in order item");
            if(currentStock < quantity) throw new IllegalStateException("Insufficient stock while capturing payment for " + product.getName());
            product.setStock(currentStock - quantity);
            productRepository.save(product);
        }

        order.setStatus("PAID");
        order = orderRepository.save(order);
        sendOrderConfirmationEmail(order, order.getUser());
        sendStatusEmail(order);
    }

    @Transactional
    public void markFailedByPaymentReference(String paymentReference){
        if(paymentReference == null || paymentReference.isBlank()) return;
        Order order = orderRepository.findByPaymentReference(paymentReference).orElse(null);
        if(order == null) return;
        if("PAID".equalsIgnoreCase(order.getStatus())) return;
        order.setStatus("PAYMENT_FAILED");
        orderRepository.save(order);
    }

    public List<Order> getAllOrders(){
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Order> getAllOrdersWithUser(){
        return orderRepository.findAllWithUserOrderByCreatedAtDesc();
    }

    @Transactional
    public void markCanceledByPaymentReference(String paymentReference){
        if(paymentReference == null || paymentReference.isBlank()) return;
        Order order = orderRepository.findByPaymentReference(paymentReference).orElse(null);
        if(order == null) return;
        if("PAID".equalsIgnoreCase(order.getStatus())) return;
        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    private void applyDiscount(Order order, String discountCode, User user) {
        if (!StringUtils.hasText(discountCode)) {
            order.setDiscountAmount(BigDecimal.ZERO);
        } else {
            String username = user != null ? user.getUsername() : null;
            BigDecimal discountAmount = discountCodeService.applyCode(discountCode, order.getTotal(), username);
            order.setDiscountCode(discountCode.toUpperCase());
            order.setDiscountAmount(discountAmount);
            order.setTotal(order.getTotal().subtract(discountAmount).max(BigDecimal.ZERO));
        }
        // Add shipping fee (free if total >= 200)
        BigDecimal shipping = settingService.computeShipping(order.getTotal());
        order.setTotal(order.getTotal().add(shipping));
    }

    private void sendOrderConfirmationEmail(Order order, User user) {
        if (user == null) return;
        String email = resolveEmail(user);
        if (StringUtils.hasText(email)) {
            try { emailService.sendOrderConfirmationEmail(email, order); } catch (Exception ignored) {}
        }
    }

    private void sendStatusEmail(Order order) {
        User user = order.getUser();
        if (user == null) return;
        String status = order.getStatus();
        if (!"PAID".equals(status) && !"SHIPPED".equals(status) && !"CANCELLED".equals(status) && !"DELIVERED".equals(status)) return;
        String email = resolveEmail(user);
        if (StringUtils.hasText(email)) {
            try { emailService.sendOrderStatusUpdateEmail(email, order); } catch (Exception ignored) {}
        }
    }

    private String resolveEmail(User user) {
        if (StringUtils.hasText(user.getEmail())) return user.getEmail();
        if (user.getUsername() != null && user.getUsername().contains("@")) return user.getUsername();
        return null;
    }

    private Order buildOrder(List<Map<String,Object>> items, User user){
        if(items == null || items.isEmpty()){
            throw new IllegalArgumentException("Order must contain items");
        }

        Order order = new Order();
        order.setUser(user);

        BigDecimal total = BigDecimal.ZERO;
        for(Map<String,Object> item : items){
            if(item == null) throw new IllegalArgumentException("Invalid order item");

            Object productIdValue = item.get("productId");
            Object quantityValue = item.get("quantity");
            if(!(productIdValue instanceof Number) || !(quantityValue instanceof Number)){
                throw new IllegalArgumentException("Order item must include numeric productId and quantity");
            }

            Long productId = ((Number) productIdValue).longValue();
            Integer qty = ((Number) quantityValue).intValue();

            if(qty <= 0) throw new IllegalArgumentException("Quantity must be positive");

            Product prod = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

            int stock = prod.getStock() == null ? 0 : prod.getStock();
            if(stock < qty) throw new IllegalArgumentException("Insufficient stock for " + prod.getName());

            OrderItem oi = new OrderItem(prod, qty, prod.getPrice());
            oi.setOrder(order);
            order.getItems().add(oi);
            total = total.add(prod.getPrice().multiply(BigDecimal.valueOf(qty)));
        }

        order.setTotal(total);
        return order;
    }

    private String normalizeStatus(String status){
        if(status == null || status.isBlank()) return "CREATED";
        return status.trim().toUpperCase();
    }

    private String normalizePaymentMethod(String paymentMethod){
        if(paymentMethod == null || paymentMethod.isBlank()) return "CASH_ON_DELIVERY";

        String normalized = paymentMethod.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        if ("COD".equals(normalized) || "CASH_ON_DELIVERY".equals(normalized) || "CASH".equals(normalized)) {
            return "CASH_ON_DELIVERY";
        }
        if ("CARD".equals(normalized) || "CARD_ONLINE".equals(normalized) || "NETOPIA".equals(normalized) || "STRIPE".equals(normalized)) {
            return "CARD_ONLINE";
        }
        return "CASH_ON_DELIVERY";
    }
}
