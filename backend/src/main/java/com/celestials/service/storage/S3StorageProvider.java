package com.celestials.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.File;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageProvider implements StorageProvider {

    @Value("${storage.s3.access-key}")
    private String accessKey;

    @Value("${storage.s3.secret-key}")
    private String secretKey;

    @Value("${storage.s3.bucket}")
    private String bucket;

    @Value("${storage.s3.region:us-east-1}")
    private String region;

    @Value("${storage.s3.endpoint:}")
    private String endpoint;

    @Value("${storage.s3.public-url:}")
    private String publicUrl;

    private S3Client s3Client;
    private S3Presigner presigner;

    private synchronized S3Client getS3Client() {
        if (s3Client == null) {
            var credentials = AwsBasicCredentials.create(accessKey, secretKey);
            var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials));

            if (endpoint != null && !endpoint.isEmpty()) {
                builder.endpointOverride(URI.create(endpoint))
                    .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build());
            }

            s3Client = builder.build();
        }
        return s3Client;
    }

    private synchronized S3Presigner getPresigner() {
        if (presigner == null) {
            var credentials = AwsBasicCredentials.create(accessKey, secretKey);
            var builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials));

            if (endpoint != null && !endpoint.isEmpty()) {
                builder.endpointOverride(URI.create(endpoint));
            }

            presigner = builder.build();
        }
        return presigner;
    }

    @Override
    public String uploadFile(MultipartFile file, String directory) {
        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            String key = directory + "/" + fileName;

            File tempFile = File.createTempFile("upload", null);
            file.transferTo(tempFile);

            getS3Client().putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build(),
                tempFile.toPath()
            );

            tempFile.delete();

            // Return the URL via getFileUrl to support signed URLs if needed
            if (publicUrl != null && !publicUrl.isEmpty()) {
                return getFileUrl(publicUrl + "/" + key);
            }
            return getFileUrl("s3://" + bucket + "/" + key);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileKey) {
        try {
            String key = extractKeyFromUrl(fileKey);
            getS3Client().deleteObject(
                DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from S3: " + e.getMessage(), e);
        }
    }

    @Override
    public String getFileUrl(String fileKey) {
        try {
            // If public URL is configured, use it (already signed in uploadFile)
            if (publicUrl != null && !publicUrl.isEmpty() && fileKey.startsWith(publicUrl)) {
                return fileKey;
            }

            // For s3:// URLs, generate a signed URL valid for 1 hour
            String key = extractKeyFromUrl(fileKey);
            
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(b -> b.bucket(bucket).key(key))
                .build();

            PresignedGetObjectRequest presignedRequest = getPresigner().presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (Exception e) {
            // If signing fails, return the original URL
            return fileKey;
        }
    }

    private String extractKeyFromUrl(String fileKey) {
        if (fileKey.startsWith("s3://")) {
            return fileKey.replace("s3://" + bucket + "/", "");
        }
        if (publicUrl != null && !publicUrl.isEmpty() && fileKey.startsWith(publicUrl)) {
            return fileKey.replace(publicUrl + "/", "");
        }
        return fileKey;
    }
}
