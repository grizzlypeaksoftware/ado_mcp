# Manual End-to-End Test Plan

This document describes manual testing procedures for validating the HTTP transport functionality.

## Prerequisites

1. Azure DevOps organization with valid PAT
2. Environment variables configured:
   ```bash
   export ADO_ORG_URL="https://dev.azure.com/your-org"
   export ADO_PAT="your-pat-token"
   export ADO_PROJECT="your-project"
   ```

## Test Execution

### Start the Server

```bash
# Development mode
npm run dev:http

# Production mode
npm run build && npm run start:http
```

Expected: Server starts on port 3000 (or configured port)

---

## Test Cases

### TC-01: Health Check

**Request:**
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "sessions": 0
}
```

**Pass Criteria:** Status 200, JSON response with "healthy" status

---

### TC-02: Initialize Session

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "manual-test", "version": "1.0.0"}
    },
    "id": 1
  }'
```

**Expected Response:**
- Status 200
- `Mcp-Session-Id` header present
- Response contains `protocolVersion`, `capabilities`, `serverInfo`

**Pass Criteria:** Valid session ID returned, server info contains "azure-devops-mcp"

---

### TC-03: List Tools

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {"name": "list_work_items", "description": "...", "inputSchema": {...}},
      ...
    ]
  },
  "id": 2
}
```

**Pass Criteria:** Returns array of 106 tools

---

### TC-04: Call Tool - list_projects

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_projects",
      "arguments": {}
    },
    "id": 3
  }'
```

**Expected Response:**
- Status 200
- Result contains list of Azure DevOps projects

**Pass Criteria:** Returns projects from your Azure DevOps organization

---

### TC-05: Call Tool - get_work_item

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_work_item",
      "arguments": {"id": 1}
    },
    "id": 4
  }'
```

**Expected Response:**
- Status 200
- Result contains work item details or appropriate error

**Pass Criteria:** Returns work item data or "not found" error

---

### TC-06: Session Persistence

**Step 1 - Get Session:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}' \
  -i 2>&1 | grep -i "mcp-session-id"
```

Save the returned `Mcp-Session-Id` value.

**Step 2 - Reuse Session:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: <session-id-from-step-1>" \
  -d '{"jsonrpc":"2.0","method":"ping","id":2}' \
  -i 2>&1 | grep -i "mcp-session-id"
```

**Pass Criteria:** Same session ID returned in both requests

---

### TC-07: CORS Preflight

**Request:**
```bash
curl -X OPTIONS http://localhost:3000/mcp \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

**Expected Response:**
- Status 204
- `Access-Control-Allow-Origin` header present
- `Access-Control-Allow-Methods` includes POST

**Pass Criteria:** CORS headers allow the request

---

### TC-08: Invalid Method

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"invalid/method","id":5}'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found: invalid/method"
  },
  "id": 5
}
```

**Pass Criteria:** Returns JSON-RPC method not found error (-32601)

---

### TC-09: Tool Not Found

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {"name": "nonexistent_tool", "arguments": {}},
    "id": 6
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Unknown tool: nonexistent_tool"
  },
  "id": 6
}
```

**Pass Criteria:** Returns tool not found error

---

### TC-10: Docker Deployment

**Step 1 - Build Image:**
```bash
docker build -t ado-mcp .
```

**Step 2 - Run Container:**
```bash
docker run -p 3000:3000 \
  -e ADO_ORG_URL="https://dev.azure.com/your-org" \
  -e ADO_PAT="your-pat-token" \
  ado-mcp
```

**Step 3 - Test Health:**
```bash
curl http://localhost:3000/health
```

**Pass Criteria:** Server responds with healthy status from Docker container

---

## Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-01 | PASS/FAIL | |
| TC-02 | PASS/FAIL | |
| TC-03 | PASS/FAIL | |
| TC-04 | PASS/FAIL | |
| TC-05 | PASS/FAIL | |
| TC-06 | PASS/FAIL | |
| TC-07 | PASS/FAIL | |
| TC-08 | PASS/FAIL | |
| TC-09 | PASS/FAIL | |
| TC-10 | PASS/FAIL | |

## Sign-off

- [ ] All test cases executed
- [ ] All critical tests passing
- [ ] Issues documented and tracked

Tested by: _________________ Date: _________________
