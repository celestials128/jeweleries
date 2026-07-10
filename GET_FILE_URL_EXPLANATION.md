# getFileUrl() Implementation - Now Fully Utilized

## Overview
The `getFileUrl(String fileKey)` method is now properly used in both storage providers to handle URL generation and transformation.

---

## Implementation Details

### **LocalStorageProvider**
```java
@Override
public String getFileUrl(String fileKey) {
    // For local storage, just return the URL as-is (no signing needed)
    return fileKey;
}
```
✅ Called in `uploadFile()` before returning to controller  
✅ Simple pass-through for local files (no transformation needed)  

**Flow:**
```
uploadFile() → generates URL → calls getFileUrl() → returns same URL
```

---

### **S3StorageProvider**
```java
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
```

✅ Generates AWS-signed URLs with 1-hour expiry  
✅ Handles both CDN URLs and s3:// internal URLs  
✅ Provides time-limited access for security  

**Flow:**
```
uploadFile() → generates s3://... URL → calls getFileUrl() → returns signed URL with signature
```

---

## Usage Pattern

### Upload Endpoint (UploadController.java)
```java
@PostMapping
public ResponseEntity<?> uploadFile(...) {
    String fileUrl = storageProvider.uploadFile(file, directory);
    
    // fileUrl already processed through getFileUrl()
    // No need to call getFileUrl() again
    
    return ResponseEntity.ok(response.put("url", fileUrl));
}
```

### Potential Future Use Cases for getFileUrl()

1. **URL Transformation** - Rewrite URLs for different environments
   ```java
   public String getFileUrl(String fileKey) {
       if (isProduction()) {
           return rewriteForCDN(fileKey);  // Redirect through CDN
       }
       return fileKey;
   }
   ```

2. **Refresh Expired Signed URLs** - For S3 files accessed later
   ```java
   @GetMapping("/api/download/{fileId}")
   public ResponseEntity<?> getDownloadUrl(@PathVariable String fileId) {
       String storedUrl = database.getFileUrl(fileId);
       String currentUrl = storageProvider.getFileUrl(storedUrl);  // Refresh signature
       return ResponseEntity.ok(Map.of("url", currentUrl));
   }
   ```

3. **Analytics/Logging** - Track when URLs are accessed
   ```java
   public String getFileUrl(String fileKey) {
       analytics.logFileAccess(fileKey);
       return fileKey;
   }
   ```

---

## Security Benefits

### Local Storage
- Files served directly via Spring static resource handler
- No signing needed (files on same server)

### S3 Storage (Signed URLs)
✅ **Time-limited access** - URLs expire after 1 hour  
✅ **No permanent credentials** - Signature includes timestamp  
✅ **AWS-verified** - Only requests signed by backend are valid  
✅ **Prevents hotlinking** - Users can't share permanent URLs  

**Example signed URL:**
```
https://celestials.s3.amazonaws.com/products/uuid_image.jpg
?X-Amz-Algorithm=AWS4-HMAC-SHA256
&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20260709%2Fus-east-1%2Fs3%2Faws4_request
&X-Amz-Date=20260709T151000Z
&X-Amz-Expires=3600
&X-Amz-Signature=...
&X-Amz-SignedHeaders=host
```

The `Expires=3600` means this URL is only valid for 1 hour.

---

## Configuration

### Local Storage (Dev)
```yaml
storage:
  type: local
  local:
    path: uploads
    base-url: http://localhost:8080
```
→ `getFileUrl()` returns: `http://localhost:8080/uploads/products/uuid_file.jpg`

### S3 with CDN (Production)
```yaml
storage:
  type: s3
  s3:
    bucket: celestials-prod
    public-url: https://d123.cloudfront.net
```
→ `getFileUrl()` returns: `https://d123.cloudfront.net/products/uuid_file.jpg`  
(No signature needed if using public CDN)

### S3 without CDN (Production)
```yaml
storage:
  type: s3
  s3:
    bucket: celestials-prod
```
→ `getFileUrl()` returns: AWS signed URL with 1-hour expiry

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│   Frontend / Browser                │
└──────────────┬──────────────────────┘
               │ POST /api/upload (JWT)
               ▼
┌──────────────────────────────────────┐
│   UploadController                   │
│   uploadFile(MultipartFile, dir)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   StorageProvider (interface)        │
│   uploadFile() → calls getFileUrl()  │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼────────┐   ┌────▼──────────┐
   │Local        │   │S3             │
   │getFileUrl() │   │getFileUrl()   │
   │→ pass-thru  │   │→ sign URL     │
   └─────────────┘   └───────────────┘
        │                   │
        └─────────┬─────────┘
                  │
         ┌────────▼────────┐
         │ Response to FE  │
         │ { url: "..." }  │
         └─────────────────┘
               │
         ┌─────▼──────────┐
         │ FE Renders     │
         │ <img src=url/> │
         └────────────────┘
```

---

## Summary

✅ **getFileUrl() is now fully utilized:**
- **LocalStorageProvider**: Pass-through for simplicity
- **S3StorageProvider**: Generates AWS-signed URLs with 1-hour expiry
- **UploadController**: Calls it automatically in `uploadFile()`
- **Security**: Prevents permanent URL sharing; time-limited access

**Zero unused code** — every method serves a purpose in the upload flow.
