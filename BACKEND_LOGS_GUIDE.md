# Backend Logs - How to Access and Debug

## Quick Reference - Access Backend Logs

### 1. **Real-Time Logs** (Follow in real-time)
```bash
docker-compose logs -f backend
```
✅ Live stream of all backend logs  
✅ Press `Ctrl+C` to exit  
✅ Best for: Debugging in real-time, watching API requests

---

### 2. **Last N Lines** (Quick snapshot)
```bash
# Last 50 lines
docker-compose logs --tail 50 backend

# Last 100 lines
docker-compose logs --tail 100 backend
```
✅ Shows recent activity  
✅ Quick overview of current state  

---

### 3. **Since Time Period** (Filter by time)
```bash
# Last 10 minutes
docker-compose logs --since 10m backend

# Last 30 seconds
docker-compose logs --since 30s backend

# Since specific timestamp
docker-compose logs --since "2026-07-09T15:00:00" backend
```
✅ Find logs around specific time  
✅ Useful after specific action

---

### 4. **Search for Errors**
```bash
# All ERROR lines
docker-compose logs backend 2>&1 | Select-String 'ERROR'

# All WARNING lines
docker-compose logs backend 2>&1 | Select-String 'WARN'

# Find upload errors
docker-compose logs backend 2>&1 | Select-String 'upload'

# Find specific user
docker-compose logs backend 2>&1 | Select-String 'admin@celestials.com'
```
✅ Quick error diagnosis  
✅ Filter large logs

---

### 5. **Combined Filters**
```bash
# Errors from last 5 minutes
docker-compose logs --since 5m backend 2>&1 | Select-String 'ERROR'

# Warnings with line numbers
docker-compose logs backend 2>&1 | Select-String -Pattern 'WARN' | Select-Object -First 20

# Find all stack traces
docker-compose logs backend 2>&1 | Select-String 'Exception'
```
✅ Powerful debugging

---

## Log Format Understanding

```
backend-1  | 2026-07-09T15:17:11.243Z  INFO 1 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet
          |                              |    |
          |                              |    Thread pool executor
          |                              Level: INFO/WARN/ERROR/DEBUG
          Container name
```

| Field | Meaning |
|-------|---------|
| `backend-1` | Container name |
| `2026-07-09T15:17:11.243Z` | Timestamp (ISO 8601, UTC) |
| `INFO/WARN/ERROR/DEBUG` | Log level |
| `[nio-8080-exec-1]` | Thread handling request |
| `o.a.c.c.C.` | Class name (abbreviated) |
| `: Message` | Actual log message |

---

## Common Log Messages

### **Startup Logs**
```
INFO 1 --- [main] com.celestials.CelestialsApplication : Starting CelestialsApplication
INFO 1 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port 8080 (http)
INFO 1 --- [main] com.celestials.CelestialsApplication : Started CelestialsApplication in X.XXX seconds
```
✅ Backend is running

### **API Requests**
```
INFO 1 --- [nio-8080-exec-1] c.c.c.ProductController : Getting all products
Hibernate: select p1_0.id,p1_0.description,...
INFO 1 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet : Completed initialization in 1 ms
```
✅ API endpoint called

### **Authentication**
```
INFO 1 --- [nio-8080-exec-1] c.c.s.JwtFilter : JWT token validated
Hibernate: select u1_0.id,u1_0.password,u1_0.role,u1_0.username from users u1_0 where u1_0.username=?
```
✅ User authenticated

### **Database Errors**
```
ERROR 1 --- [nio-8080-exec-1] c.c.e.ExceptionHandler : Database error
org.hibernate.exception.JDBCException: Could not extract ResultSet
```
❌ Database connection issue

### **File Upload**
```
INFO 1 --- [nio-8080-exec-1] c.c.s.s.LocalStorageProvider : Uploading file to: /app/uploads/products/uuid_filename.jpg
INFO 1 --- [nio-8080-exec-1] c.c.c.UploadController : File uploaded successfully
```
✅ Upload successful

---

## Log Levels

| Level | Use | Example |
|-------|-----|---------|
| **DEBUG** | Detailed debugging info | `DEBUG: userId = 123` |
| **INFO** | General information | `INFO: User logged in` |
| **WARN** | Warning, may need attention | `WARN: Cache miss` |
| **ERROR** | Error occurred | `ERROR: Upload failed` |
| **FATAL** | Critical error | `FATAL: Database connection lost` |

---

## Debugging Specific Issues

### Issue: "Upload Failed"
```bash
docker-compose logs backend 2>&1 | Select-String 'upload|Upload|UPLOAD'
```
Look for:
```
ERROR: Failed to upload file: java.io.FileNotFoundException
ERROR: File size exceeds limit
ERROR: Unsupported file type
```

### Issue: "Authentication Failed"
```bash
docker-compose logs backend 2>&1 | Select-String 'JWT|Auth|token'
```
Look for:
```
WARN: Invalid JWT token
WARN: Token expired
ERROR: User not found
```

### Issue: "Database Connection"
```bash
docker-compose logs backend 2>&1 | Select-String 'Database|Connection|JDBC|Hibernate'
```
Look for:
```
ERROR: Failed to connect to database
ERROR: Connection timeout
ERROR: Schema validation failed
```

---

## Advanced Logging Commands

### Save logs to file
```bash
docker-compose logs backend > backend-logs.txt
```

### Get logs with timestamps only
```bash
docker-compose logs backend 2>&1 | Select-String '^\[' -Pattern '^backend-1'
```

### Monitor specific endpoint
```bash
docker-compose logs -f backend 2>&1 | Select-String '/api/upload'
```

### Watch for new errors
```bash
docker-compose logs -f backend 2>&1 | Select-String 'ERROR'
```

### Full container logs with database
```bash
docker-compose logs frontend backend db
```

---

## Enable More Detailed Logging

### In `application-dev.yml`:
```yaml
logging:
  level:
    root: INFO
    com.celestials: DEBUG              # Your app's classes
    org.springframework.web: DEBUG      # Spring Web
    org.hibernate.SQL: DEBUG            # SQL queries
    org.hibernate.type.descriptor: TRACE  # Query parameters
```

### Then rebuild and restart:
```bash
docker-compose up -d --build
```

---

## Log Access Methods Summary

| Method | Command | Use Case |
|--------|---------|----------|
| **Real-time** | `docker-compose logs -f backend` | Live debugging |
| **Recent** | `docker-compose logs --tail 50 backend` | Quick check |
| **Time range** | `docker-compose logs --since 5m backend` | Find recent issues |
| **Search errors** | `docker-compose logs backend \| Select-String ERROR` | Error diagnosis |
| **Save to file** | `docker-compose logs backend > backup.txt` | Archive |

---

## Common Patterns

### Check if backend is healthy
```bash
docker-compose logs backend 2>&1 | Select-String 'Started.*CelestialsApplication'
```
✅ If found: Backend running successfully

### Find failed requests
```bash
docker-compose logs backend 2>&1 | Select-String 'ERROR|Exception'
```
❌ If multiple: Look for errors

### Monitor API usage
```bash
docker-compose logs -f backend 2>&1 | Select-String '/api/'
```
✅ Watch API calls in real-time

### Track file uploads
```bash
docker-compose logs -f backend 2>&1 | Select-String 'upload|Upload'
```
✅ Watch upload progress

---

## Tips

💡 **Use grep/Select-String for faster searching**
```bash
# Instead of reading entire log
docker-compose logs backend 2>&1 | Select-String 'keyword' -Context 3
# Shows 3 lines before and after match
```

💡 **Combine multiple searches**
```bash
docker-compose logs backend 2>&1 | Select-String 'ERROR' | Select-String 'upload'
# Errors related to uploads only
```

💡 **Follow logs while testing**
```bash
# Terminal 1: Watch logs
docker-compose logs -f backend

# Terminal 2: Run tests or make API calls
curl http://localhost:8080/api/products
```

💡 **Save logs for analysis**
```bash
docker-compose logs backend > logs-$(date +%Y%m%d-%H%M%S).txt
```

