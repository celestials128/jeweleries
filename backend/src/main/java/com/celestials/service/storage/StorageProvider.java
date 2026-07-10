package com.celestials.service.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageProvider {
    /**
     * Upload a file and return the URL to access it
     */
    String uploadFile(MultipartFile file, String directory);

    /**
     * Delete a file
     */
    void deleteFile(String fileKey);

    /**
     * Get a secure/signed URL for the file (signed URLs for S3, regular for local)
     * @param fileKey The file key/path
     * @return A secure URL (optionally signed)
     */
    String getFileUrl(String fileKey);
}
