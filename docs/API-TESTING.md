# API Testing Guide

## Test Release JSON

Use the file `test-release.json` to test all API endpoints.

## Testing All Endpoints

### 1. Health Check
```bash
curl http://localhost:8000/api/health
```

### 2. GET /api/releases (List releases with pagination)
```bash
# Get all releases (default pagination)
curl http://localhost:8000/api/releases

# Get with custom pagination
curl "http://localhost:8000/api/releases?limit=1&offset=0"
```

### 3. POST /api/releases (Upload/Create release)
```bash
# Upload a new release from test-release.json
curl -X POST http://localhost:8000/api/releases \
  -H "Content-Type: application/json" \
  -d @test-release.json

# Or create a simple test release
curl -X POST http://localhost:8000/api/releases \
  -H "Content-Type: application/json" \
  -d '{
    "id": "quick-test-v1",
    "name": "Quick Test",
    "version": "v1.0.0",
    "events": [{
      "step": "Test Start",
      "event": "test_start",
      "timestamp": "2026-04-14T08:00:00Z",
      "status": "success",
      "actor": "Test System",
      "snapshot": {
        "releaseState": "testing",
        "validationState": "running",
        "trialState": "not_started",
        "deploymentState": "not_started",
        "notificationState": "not_sent",
        "aircraft": "TEST",
        "triggeredBy": "Test System",
        "relatedData": {}
      }
    }]
  }'
```

### 4. GET /api/releases/{id} (Get specific release)
```bash
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0
```

### 5. GET /api/releases/{id}/events (Get events for release)
```bash
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0/events
```

### 6. GET /api/releases/{id}/replay?step={index} (Get replay state at step)
```bash
# Get state at step 0
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0/replay?step=0

# Get state at step 3
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0/replay?step=3

# Get state at last step (default)
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0/replay
```

### 7. PATCH /api/releases/{id} (Update release metadata)
```bash
# Update name and environment
curl -X PATCH http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Release",
    "environment": "Production",
    "description": "Updated via PATCH endpoint"
  }'

# Verify update
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0 | grep -A2 '"name"'
```

### 8. DELETE /api/releases/{id} (Delete release)
```bash
# Delete the test release
curl -X DELETE http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0

# Verify deletion (should return 404)
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0
```

## Complete Test Workflow

```bash
# 1. Check health
curl http://localhost:8000/api/health

# 2. List existing releases
curl http://localhost:8000/api/releases

# 3. Upload new test release
curl -X POST http://localhost:8000/api/releases \
  -H "Content-Type: application/json" \
  -d @test-release.json

# 4. Get the uploaded release
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0

# 5. Update the release
curl -X PATCH http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "environment": "Staging"}'

# 6. Get replay state at different steps
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0/replay?step=0
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0/replay?step=4

# 7. Delete the release
curl -X DELETE http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0

# 8. Verify deletion (404 expected)
curl http://localhost:8000/api/releases/test-release-comprehensive-v1-0-0
```

## Expected HTTP Status Codes

| Method | Endpoint | Success | Error |
|--------|----------|---------|-------|
| GET | /api/health | 200 | - |
| GET | /api/releases | 200 | - |
| POST | /api/releases | 201 (new), 200 (update) | 400 |
| GET | /api/releases/{id} | 200 | 404 |
| GET | /api/releases/{id}/events | 200 | 404 |
| GET | /api/releases/{id}/replay | 200 | 404 |
| PATCH | /api/releases/{id} | 200 | 400, 404 |
| DELETE | /api/releases/{id} | 200 | 404 |

## Response Format

All responses follow the common envelope:
```json
{
  "message": "descriptive message",
  "data": {},
  "error": "error message (if any)"
}
```

Paginated responses include:
```json
{
  "message": "Releases fetched successfully",
  "data": [...],
  "pagination": {
    "total": 42,
    "limit": 100,
    "offset": 0,
    "count": 2
  }
}
```
