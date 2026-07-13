package com.celestials.service;

import com.celestials.dto.NetopiaCheckoutRequest;
import com.celestials.dto.NetopiaCheckoutResponse;
import com.celestials.model.Order;
import com.celestials.model.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.PublicKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NetopiaPaymentService {

    private static final DateTimeFormatter NETOPIA_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @Value("${netopia.signature:}")
    private String signature;

    @Value("${netopia.start-url:https://secure.sandbox.netopia-payments.com/payment/card/start}")
    private String startUrl;

    @Value("${netopia.confirm-url:http://localhost:8080/api/payments/netopia/confirm}")
    private String confirmUrl;

    @Value("${netopia.return-url:http://localhost:3000/orders}")
    private String defaultReturnUrl;

    @Value("${netopia.public-cert-path:}")
    private String publicCertPath;

    @Value("${netopia.currency:RON}")
    private String currency;

    @Value("${netopia.merchant-name:Celestials}")
    private String merchantName;

    public NetopiaPaymentService(OrderService orderService, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return StringUtils.hasText(signature) && StringUtils.hasText(publicCertPath);
    }

    public Map<String, Object> getStatus() {
        return Map.of(
                "configured", isConfigured(),
                "signatureConfigured", StringUtils.hasText(signature),
                "publicCertConfigured", StringUtils.hasText(publicCertPath)
        );
    }

    @Transactional
    public NetopiaCheckoutResponse createCheckout(NetopiaCheckoutRequest request, User user) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Order must contain items");
        }
        if (!isConfigured()) {
            throw new IllegalStateException("NETOPIA signature is not configured");
        }

        Order order = orderService.createPendingOrder(request.items(), user, request.discountCode());
        String paymentReference = order.getPaymentReference();
        String xml = buildCheckoutXml(order, request);
        EncryptedPayload payload = encrypt(xml);

        return new NetopiaCheckoutResponse(
                startUrl,
                payload.data(),
                payload.envKey(),
                paymentReference,
                order.getId()
        );
    }

    @Transactional
    public void handleConfirm(String payload) {
        handleCallback(payload);
    }

    @Transactional
    public void handleNotify(String payload) {
        handleCallback(payload);
    }

    private void handleCallback(String payload) {
        if (!StringUtils.hasText(payload)) {
            return;
        }

        String paymentReference = extractPaymentReference(payload);
        if (!StringUtils.hasText(paymentReference)) {
            return;
        }

        if (isFailure(payload)) {
            orderService.markFailedByPaymentReference(paymentReference);
            return;
        }

        orderService.markPaidByPaymentReference(paymentReference);
    }

    public boolean isNetopiaSuccess(String payload) {
        if (!StringUtils.hasText(payload)) {
            return false;
        }
        return !isFailure(payload);
    }

    public String buildCrcResponse() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><crc>OK</crc>";
    }

    public String buildNotifyResponse() {
        return "{\"errorCode\":0}";
    }

    private String buildCheckoutXml(Order order, NetopiaCheckoutRequest request) {
        NetopiaCheckoutRequest.BillingInfo billing = request.billing();
        if (billing == null) {
            throw new IllegalArgumentException("Billing information is required");
        }

        BigDecimal total = order.getTotal();
        String amount = total == null ? "0.00" : total.setScale(2, RoundingMode.HALF_UP).toPlainString();
        String timestamp = OffsetDateTime.now(ZoneOffset.UTC).format(NETOPIA_TIMESTAMP);
        String returnUrl = StringUtils.hasText(request.returnUrl()) ? request.returnUrl() : defaultReturnUrl;

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.append("<order type=\"card\" timestamp=\"").append(escapeXml(timestamp)).append("\">");
        xml.append("<signature>").append(escapeXml(signature)).append("</signature>");
        xml.append("<orderid>").append(escapeXml(order.getPaymentReference())).append("</orderid>");
        xml.append("<amount>").append(escapeXml(amount)).append("</amount>");
        xml.append("<currency>").append(escapeXml(currency)).append("</currency>");
        xml.append("<customer>");
        xml.append("<first_name>").append(escapeXml(nullToEmpty(billing.firstName()))).append("</first_name>");
        xml.append("<last_name>").append(escapeXml(nullToEmpty(billing.lastName()))).append("</last_name>");
        xml.append("<email>").append(escapeXml(nullToEmpty(billing.email()))).append("</email>");
        xml.append("<phone>").append(escapeXml(nullToEmpty(billing.phone()))).append("</phone>");
        xml.append("</customer>");
        xml.append("<billing>");
        xml.append("<name>").append(escapeXml(joinName(billing.firstName(), billing.lastName()))).append("</name>");
        xml.append("<company></company>");
        xml.append("<country>").append(escapeXml(defaultIfBlank(billing.country(), "RO"))).append("</country>");
        xml.append("<city>").append(escapeXml(nullToEmpty(billing.city()))).append("</city>");
        xml.append("<address>").append(escapeXml(nullToEmpty(billing.address()))).append("</address>");
        xml.append("<postal_code>").append(escapeXml(nullToEmpty(billing.postalCode()))).append("</postal_code>");
        xml.append("</billing>");
        xml.append("<urls>");
        xml.append("<confirm>").append(escapeXml(confirmUrl)).append("</confirm>");
        xml.append("<return>").append(escapeXml(returnUrl)).append("</return>");
        xml.append("</urls>");
        xml.append("<details>");
        xml.append("<order_name>").append(escapeXml(merchantName + " order #" + order.getId())).append("</order_name>");
        xml.append("<description>").append(escapeXml("Celestials jewelry order")).append("</description>");
        xml.append("</details>");
        xml.append("</order>");
        return xml.toString();
    }

    private EncryptedPayload encrypt(String xml) {
        try {
            X509Certificate certificate = loadCertificate(publicCertPath);
            PublicKey publicKey = certificate.getPublicKey();

            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            keyGenerator.init(128);
            SecretKey secretKey = keyGenerator.generateKey();

            byte[] iv = new byte[16];
            java.security.SecureRandom random = new java.security.SecureRandom();
            random.nextBytes(iv);

            Cipher aesCipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            aesCipher.init(Cipher.ENCRYPT_MODE, secretKey, new IvParameterSpec(iv));
            byte[] encryptedXml = aesCipher.doFinal(xml.getBytes(StandardCharsets.UTF_8));

            byte[] dataBytes = new byte[iv.length + encryptedXml.length];
            System.arraycopy(iv, 0, dataBytes, 0, iv.length);
            System.arraycopy(encryptedXml, 0, dataBytes, iv.length, encryptedXml.length);

            Cipher rsaCipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            rsaCipher.init(Cipher.ENCRYPT_MODE, publicKey);
            byte[] encryptedKey = rsaCipher.doFinal(secretKey.getEncoded());

            return new EncryptedPayload(
                    Base64.getEncoder().encodeToString(dataBytes),
                    Base64.getEncoder().encodeToString(encryptedKey)
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to prepare NETOPIA payload", ex);
        }
    }

    private X509Certificate loadCertificate(String location) throws Exception {
        String trimmed = location == null ? "" : location.trim();
        if (!StringUtils.hasText(trimmed)) {
            throw new IllegalStateException("NETOPIA public certificate path is not configured");
        }

        CertificateFactory factory = CertificateFactory.getInstance("X.509");
        if (trimmed.startsWith("classpath:")) {
            String resourcePath = trimmed.substring("classpath:".length());
            InputStream inputStream = getClass().getResourceAsStream(resourcePath.startsWith("/") ? resourcePath : "/" + resourcePath);
            if (inputStream == null) {
                throw new IllegalStateException("NETOPIA certificate resource not found: " + location);
            }
            try (InputStream in = inputStream) {
                return (X509Certificate) factory.generateCertificate(in);
            }
        }

        Path path = Paths.get(trimmed);
        if (!Files.exists(path)) {
            throw new IllegalStateException("NETOPIA certificate file not found: " + location);
        }

        try (InputStream in = Files.newInputStream(path)) {
            return (X509Certificate) factory.generateCertificate(in);
        }
    }

    private String extractPaymentReference(String payload) {
        JsonNode json = parseJson(payload);
        if (json != null) {
            String fromJson = findText(json, "paymentReference", "orderId", "order_id", "id", "reference");
            if (StringUtils.hasText(fromJson)) {
                return fromJson;
            }
        }

        Pattern[] patterns = new Pattern[]{
                Pattern.compile("<(?:paymentReference|orderId|order_id|id|reference)>([^<]+)</(?:paymentReference|orderId|order_id|id|reference)>", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(?:paymentReference|orderId|order_id|reference)\\\"?\\s*[:=]\\s*\\\"?([A-Za-z0-9._-]+)\\\"?", Pattern.CASE_INSENSITIVE),
                Pattern.compile("id=\\\"([^\\\"]+)\\\"", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(payload);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        return null;
    }

    private boolean isFailure(String payload) {
        JsonNode json = parseJson(payload);
        if (json != null) {
            JsonNode errorCode = json.get("errorCode");
            if (errorCode != null && errorCode.isNumber() && errorCode.asInt() != 0) {
                return true;
            }

            String status = findText(json, "status", "paymentStatus", "state", "result");
            if (StringUtils.hasText(status)) {
                String normalized = status.toLowerCase(Locale.ROOT);
                return normalized.contains("fail")
                        || normalized.contains("cancel")
                        || normalized.contains("declin")
                        || normalized.contains("reject");
            }
            return false;
        }

        String normalized = payload.toLowerCase(Locale.ROOT);
        return normalized.contains("error") || normalized.contains("fail") || normalized.contains("cancel");
    }

    private JsonNode parseJson(String payload) {
        try {
            String trimmed = payload == null ? "" : payload.trim();
            if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
                return null;
            }
            return objectMapper.readTree(trimmed);
        } catch (Exception ex) {
            return null;
        }
    }

    private String findText(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode value = node.get(name);
            if (value != null && value.isValueNode()) {
                String text = value.asText();
                if (StringUtils.hasText(text)) {
                    return text;
                }
            }
        }
        for (String name : names) {
            JsonNode nested = node.get(name);
            if (nested != null && nested.isObject()) {
                String nestedValue = findText(nested, names);
                if (StringUtils.hasText(nestedValue)) {
                    return nestedValue;
                }
            }
        }
        return null;
    }

    private String escapeXml(String value) {
        return value == null ? "" : value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String joinName(String firstName, String lastName) {
        String combined = (nullToEmpty(firstName) + " " + nullToEmpty(lastName)).trim();
        return StringUtils.hasText(combined) ? combined : merchantName;
    }

    private record EncryptedPayload(String data, String envKey) {}
}
