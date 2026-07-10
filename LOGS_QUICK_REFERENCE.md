# Backend Logs - Quick Reference Card

## TL;DR - Most Common Commands

```bash
# 1. Real-time logs
docker-compose logs -f backend

# 2. Last 50 lines
docker-compose logs --tail 50 backend

# 3. Find errors
docker-compose logs backend 2>&1 | Select-String ERROR

# 4. Last 5 minutes
docker-compose logs --since 5m backend

# 5. Save to file
docker-compose logs backend > logs.txt
```

---

## Log Locations

| Where | How to Access |
|-------|---------------|
| **Container output** | `docker-compose logs backend` |
| **Real-time stream** | `docker-compose logs -f backend` |
| **Inside container** | `docker exec celestials-backend-1 sh` |
| **Stdout/Stderr** | Captured by docker-compose |

⚠️ **Note:** Logs are NOT stored in files in the container - they go to stdout/stderr, captured by Docker daemon.

---

## Quick Filters

| Find | Command |
|------|---------|
| Startup errors | `docker-compose logs backend \| Select-String 'ERROR\|Failed'` |
| Upload issues | `docker-compose logs backend \| Select-String -i 'upload'` |
| Auth problems | `docker-compose logs backend \| Select-String -i 'jwt\|auth\|token'` |
| DB connection | `docker-compose logs backend \| Select-String -i 'database\|connection'` |
| API requests | `docker-compose logs -f backend \| Select-String '/api/'` |
| Exceptions | `docker-compose logs backend \| Select-String 'Exception\|error'` |

---

## Time Filters

```bash
--since 10s     # Last 10 seconds
--since 30s     # Last 30 seconds
--since 1m      # Last 1 minute
--since 5m      # Last 5 minutes
--since 1h      # Last 1 hour
--since 1d      # Last 1 day

--until 5m      # Until 5 minutes ago
```

---

## All Containers

```bash
# Backend only
docker-compose logs backend

# All services
docker-compose logs

# Database + Backend
docker-compose logs db backend

# With timestamps
docker-compose logs --timestamps backend

# No timestamps
docker-compose logs --no-log-prefix backend
```

---

## Examples

### Check if backend is running
```bash
docker-compose logs backend 2>&1 | Select-String 'Started CelestialsApplication'
```

### Monitor uploads in real-time
```bash
docker-compose logs -f backend 2>&1 | Select-String 'upload'
```

### Find what happened 2 minutes ago
```bash
docker-compose logs --since 2m backend | tail -20
```

### Debug failed requests
```bash
docker-compose logs backend 2>&1 | Select-String 'ERROR' -Context 5
```

### Export logs
```bash
docker-compose logs backend > backend-$(date +%Y%m%d-%H%M%S).log
```

---

## Log Levels Explained

- **DEBUG**: Detailed info (rarely used in docker-compose default config)
- **INFO**: General info (normal operations)
- **WARN**: Warning (cache misses, deprecations)
- **ERROR**: Error occurred (failed operation)
- **FATAL**: Critical error (system down)

---

## Pro Tips

✅ Use `Select-String` for powerful filtering  
✅ Combine `-f` with `Select-String` to filter live logs  
✅ Use `--since 30s` for immediate recent activity  
✅ Save logs to file for analysis later  
✅ Use `--tail 100` for quick overview  
✅ Use `--timestamps` to correlate with other systems  

---

## Troubleshooting

**"No logs showing"**
→ Check: `docker-compose ps` (is backend running?)

**"Logs are old"**
→ Use: `docker-compose logs -f` (follow flag)

**"Too many logs"**
→ Use: `--tail 50` or `Select-String 'keyword'`

**"Can't find specific request"**
→ Use: `--since 5m` to narrow time range

---

## Full Documentation
See: `BACKEND_LOGS_GUIDE.md` for comprehensive guide with examples
