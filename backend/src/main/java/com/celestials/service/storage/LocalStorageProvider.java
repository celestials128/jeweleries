package com.celestials.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageProvider implements StorageProvider {

    @Value("${storage.local.path:uploads}")
    private String uploadPathConfig;

    @Value("${storage.local.base-url:http://localhost:8080}")
    private String baseUrl;

    private Path getUploadPath() {
        Path uploadPath = Paths.get(uploadPathConfig);
        if (!uploadPath.isAbsolute()) {
            String userDir = System.getProperty("user.dir", ".");
            uploadPath = Paths.get(userDir, uploadPathConfig).normalize();
        }
        return uploadPath;
    }

    @Override
    public String uploadFile(MultipartFile file, String directory) {
        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path uploadPath = getUploadPath();
            Path directoryPath = uploadPath.resolve(directory);
            
            // Ensure directory exists
            Files.createDirectories(directoryPath);

            Path filePath = directoryPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            String fileUrl = baseUrl + "/uploads/" + directory + "/" + fileName;
            return getFileUrl(fileUrl);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileKey) {
        try {
            Path uploadPath = getUploadPath();
            String relativePath = fileKey.replace(baseUrl + "/uploads/", "");
            Path filePath = uploadPath.resolve(relativePath);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getFileUrl(String fileKey) {
        // For local storage, just return the URL as-is (no signing needed)
        return fileKey;
    }
}
