# File Upload Service - Quick Reference

## Two Storage Options

### 1. **Local Storage** (Default for dev)
```bash
STORAGE_TYPE=local
```
✅ Files stored in `./uploads/` directory  
✅ Served via `http://localhost:8080/uploads/products/<filename>`  
✅ Perfect for docker-compose development  

### 2. **S3/S3-Compatible** (Production)
```bash
STORAGE_TYPE=s3
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
S3_BUCKET=celestials-uploads
S3_REGION=us-east-1
```
✅ Works with AWS S3  
✅ Works with MinIO, DigitalOcean Spaces, etc.  
✅ Scalable for production  

---

## Frontend Integration

### Using the Hook
```tsx
import { useFileUpload } from '../hooks/useFileUpload';

export function MyComponent() {
  const { uploadFile, loading, error } = useFileUpload();

  const handleUpload = async (file) => {
    const { url } = await uploadFile(file, 'products');
    console.log('Uploaded:', url);
  };

  return (
    <>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {loading && <p>Uploading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
    </>
  );
}
```

### Using the Component
```tsx
import { ImageUploadComponent } from '../components/ImageUploadComponent';

export function AdminPanel() {
  return (
    <ImageUploadComponent 
      directory="products"
      onUploadSuccess={(url) => {
        console.log('Saved:', url);
      }}
    />
  );
}
```

---

## Backend Endpoints

### Upload File
```bash
POST /api/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

file: <binary>
directory: products (optional)
```

**Response:**
```json
{
  "url": "http://localhost:8080/uploads/products/uuid_filename.jpg",
  "filename": "filename.jpg",
  "size": 245120,
  "contentType": "image/jpeg"
}
```

### Delete File
```bash
POST /api/upload/delete?fileKey=<url>
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

---

## Security Features

✅ **JWT Authentication** - Only authenticated users can upload  
✅ **ADMIN Role Required** - Only admins can upload/delete  
✅ **Filename Randomization** - UUIDs prevent collisions/overrides  
✅ **CORS Configured** - Frontend can access `/uploads/`  
✅ **Public Read** - Uploaded files readable without auth  

---

## Testing the Upload

### 1. Get Admin Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@celestials.com","password":"admin123"}'
```

### 2. Upload Image
```bash
TOKEN="<jwt_from_step_1>"
curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.jpg" \
  -F "directory=products"
```

### 3. Access Image (no auth needed)
```bash
curl http://localhost:8080/uploads/products/<uuid>_image.jpg
```

---

## Configuration in Code

### LocalStorageProvider
- **Path**: `uploads/` (relative to app working dir)
- **Base URL**: `http://localhost:8080`
- **Files accessible**: `http://localhost:8080/uploads/products/<uuid>_file`

### S3StorageProvider
- **Endpoint**: AWS S3 by default (or MinIO/Spaces)
- **Public URL**: Optional CDN/CloudFront URL
- **Files**: `s3://bucket/products/<uuid>_file` or CDN URL

---

## Switching Between Storage Providers

**Change environment variable and restart:**
```bash
# Local (default)
STORAGE_TYPE=local

# AWS S3
STORAGE_TYPE=s3
S3_ACCESS_KEY=... S3_SECRET_KEY=... S3_BUCKET=...

# MinIO
STORAGE_TYPE=s3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=celestials
```

No code changes needed — it's all configuration!

---

## Production Deployment

### Using AWS S3
```bash
# Set environment variables
export STORAGE_TYPE=s3
export S3_ACCESS_KEY=<your-access-key>
export S3_SECRET_KEY=<your-secret-key>
export S3_BUCKET=celestials-prod
export S3_REGION=us-east-1
export S3_PUBLIC_URL=https://d123.cloudfront.net  # optional CDN

# Deploy
docker-compose up -d
```

### Using MinIO (On-Prem S3)
```bash
# MinIO container already available
export STORAGE_TYPE=s3
export S3_ENDPOINT=http://minio:9000
export S3_ACCESS_KEY=minioadmin
export S3_SECRET_KEY=minioadmin
export S3_BUCKET=celestials

# Deploy
docker-compose up -d
```

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/celestials/controller/UploadController.java` | HTTP endpoint handler |
| `backend/src/main/java/com/celestials/service/storage/StorageProvider.java` | Interface (strategy pattern) |
| `backend/src/main/java/com/celestials/service/storage/LocalStorageProvider.java` | Filesystem storage |
| `backend/src/main/java/com/celestials/service/storage/S3StorageProvider.java` | AWS S3 / S3-compatible storage |
| `backend/src/main/java/com/celestials/config/WebConfig.java` | Static resource handler |
| `frontend/src/hooks/useFileUpload.ts` | React hook for uploads |
| `frontend/src/components/ImageUploadComponent.tsx` | Ready-to-use component |
| `frontend/src/components/ImageUploadComponent.css` | Styling |
| `FILE_UPLOAD_GUIDE.md` | Full documentation |

---

## Next Steps

1. **Integrate into Admin Panel** - Add upload to product creation form
2. **Add Image Validation** - Size, format, dimensions checks
3. **Add Image Optimization** - Compress, resize, webp conversion
4. **Add CDN** - CloudFront or similar for fast delivery
5. **Add Virus Scanning** - ClamAV or similar for security
6. **Add Backup** - Sync to secondary storage

