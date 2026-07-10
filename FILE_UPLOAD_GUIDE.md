## File Upload Service - Celestials Backend

### Overview
A production-ready file upload mechanism with **dual storage support** (local + S3-compatible).

---

## **Architecture**

### Three-Layer Design:
```
┌─────────────────────────────────────┐
│    UploadController                 │  HTTP Endpoint
│    POST /api/upload                 │  (JWT protected, ADMIN role)
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    StorageProvider Interface        │  Abstraction
│    (local | s3)                     │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼────┐   ┌────▼────┐
   │ Local   │   │ S3      │
   │Provider │   │Provider │
   └─────────┘   └─────────┘
```

---

## **Deployment Options**

### **1. Local Storage (Default - Dev/Demo)**
✅ **Best for**: Docker-compose local development  
✅ **Features**: Files stored on backend container  
✅ **Frontend access**: Via `/uploads/` public path  

**Configuration:**
```yaml
storage:
  type: local
  local:
    path: uploads
    base-url: http://localhost:8080
```

**Files served at:**
- `http://localhost:8080/uploads/products/<uuid>_filename.jpg`

---

### **2. S3-Compatible Storage (Production)**
✅ **Best for**: AWS S3, MinIO, DigitalOcean Spaces  
✅ **Features**: Scalable, cloud-native, CDN-ready  

**Configuration:**
```yaml
storage:
  type: s3
  s3:
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    bucket: celestials-uploads
    region: us-east-1
    endpoint: https://s3.amazonaws.com          # or MinIO endpoint
    public-url: https://cdn.example.com/uploads # optional
```

**Environment variables (.env):**
```bash
STORAGE_TYPE=s3
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=celestials-uploads
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com
S3_PUBLIC_URL=https://your-cdn.com/uploads
```

---

## **API Reference**

### **Upload File**
```
POST /api/upload
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `file` (multipart): Image file (JPEG, PNG, WebP, etc.)
- `directory` (query, optional): Subdirectory in storage (default: `products`)

**Request:**
```bash
curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@product.jpg" \
  -F "directory=products"
```

**Response (200 OK):**
```json
{
  "url": "http://localhost:8080/uploads/products/a1b2c3d4_product.jpg",
  "filename": "product.jpg",
  "size": 245120,
  "contentType": "image/jpeg"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User lacks ADMIN role
- `400 Bad Request` - Empty file
- `500 Internal Server Error` - Upload failed

---

### **Delete File**
```
POST /api/upload/delete
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `fileKey` (query): File URL returned from upload endpoint

**Request:**
```bash
curl -X POST http://localhost:8080/api/upload/delete \
  -H "Authorization: Bearer <token>" \
  -G --data-urlencode "fileKey=http://localhost:8080/uploads/products/a1b2c3d4_product.jpg"
```

**Response (200 OK):**
```json
{
  "message": "File deleted successfully"
}
```

---

## **Frontend Integration**

### **React Upload Component**
```tsx
import { useState } from 'react';

export function ImageUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', 'products');

    try {
      const token = localStorage.getItem('jwt_token'); // Get from auth
      
      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setImageUrl(data.url);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleUpload} 
        disabled={loading}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
}
```

---

## **Docker Integration**

### **Local Storage (docker-compose.yml)**
```yaml
backend:
  volumes:
    - ./uploads:/app/uploads  # Persist uploads on host
```

### **S3 Storage**
```yaml
backend:
  environment:
    STORAGE_TYPE: s3
    S3_ACCESS_KEY: ${S3_ACCESS_KEY}
    S3_SECRET_KEY: ${S3_SECRET_KEY}
    S3_BUCKET: celestials-uploads
```

---

## **Security Considerations**

✅ **ADMIN-only access** - Only users with ADMIN role can upload  
✅ **JWT authentication** - Every request validated  
✅ **Filename randomization** - UUIDs prevent collisions  
✅ **CORS configured** - `/uploads/**` is publicly readable  
✅ **Public read** - Files accessible without auth (for rendering)  

---

## **Switching Storage Providers**

### **Development** (Local)
```bash
STORAGE_TYPE=local
```

### **Staging** (MinIO)
```bash
STORAGE_TYPE=s3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=celestials
```

### **Production** (AWS S3)
```bash
STORAGE_TYPE=s3
S3_ACCESS_KEY=<your-aws-access-key>
S3_SECRET_KEY=<your-aws-secret-key>
S3_BUCKET=celestials-prod
S3_REGION=us-east-1
S3_PUBLIC_URL=https://d123.cloudfront.net  # Optional CDN
```

---

## **Testing the Endpoint**

### **1. Get Admin Token**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@celestials.com","password":"admin123"}'
```

### **2. Upload Image**
```bash
TOKEN="<jwt_token_from_step_1>"
curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg" \
  -F "directory=products"
```

### **3. View Uploaded File**
Open in browser: `http://localhost:8080/uploads/products/<uuid>_test-image.jpg`

---

## **Files Modified/Created**

| File | Purpose |
|------|---------|
| `UploadController.java` | HTTP endpoint handler |
| `StorageProvider.java` | Interface (strategy pattern) |
| `LocalStorageProvider.java` | Local filesystem storage |
| `S3StorageProvider.java` | AWS S3 / S3-compatible storage |
| `WebConfig.java` | Static resource handler for `/uploads/` |
| `SecurityConfig.java` | Added `/uploads/**` to public paths |
| `application-dev.yml` | Storage configuration |
| `pom.xml` | Added AWS SDK S3 dependency |

---

## **Migration Path**

### **From Local → S3**
1. Update environment variables
2. Existing URLs won't work (files on different storage)
3. **Solution**: Implement file migration script or lazy-copy (on first access)

### **From S3 → Local**
```bash
# Download from S3 to local storage
aws s3 sync s3://celestials-prod uploads/products/
```

---

## **Troubleshooting**

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | Check JWT token is valid |
| `403 Forbidden` | Ensure user has ADMIN role |
| `400 Empty file` | Check file is not empty |
| `Cannot find file in /uploads/` | Ensure WebConfig static handler is loaded |
| S3 connection error | Check credentials, region, endpoint |

---

## **Next Steps**

1. **Add image validation** (size, mime type)
2. **Add image optimization** (resize, compress)
3. **Add CDN integration** (CloudFront, Cloudflare)
4. **Add upload progress** (multipart, resumable)
5. **Add virus scanning** (ClamAV integration)

