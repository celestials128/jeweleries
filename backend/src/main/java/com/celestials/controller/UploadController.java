package com.celestials.controller;

import com.celestials.service.storage.StorageProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final StorageProvider storageProvider;

    public UploadController(StorageProvider storageProvider) {
        this.storageProvider = storageProvider;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "directory", defaultValue = "products") String directory) {
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String fileUrl = storageProvider.uploadFile(file, directory);
            
            Map<String, Object> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("filename", file.getOriginalFilename());
            response.put("size", file.getSize());
            response.put("contentType", file.getContentType());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @PostMapping("/delete")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> deleteFile(@RequestParam("fileKey") String fileKey) {
        try {
            storageProvider.deleteFile(fileKey);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }
}
