# Azure DevOps MCP Server - HTTP API Documentation

## Overview

The Azure DevOps MCP Server supports HTTP transport in addition to the standard STDIO transport. This allows you to run the server as a standalone HTTP service that can be accessed by web applications and remote clients.

## Base URL

```
http://localhost:3000
```

The port can be configured via the `MCP_HTTP_PORT` environment variable.

## Endpoints

### Health Check

```
GET /health
```

Returns the server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessions": 5
}
```

### Server Info

```
GET /
```

Returns basic server information.

**Response:**
```json
{
  "name": "azure-devops-mcp",
  "version": "1.0.0",
  "transport": "http",
  "endpoints": {
    "mcp": "POST /mcp",
    "health": "GET /health"
  }
}
```

### MCP Endpoint

```
POST /mcp
```

Main endpoint for all MCP JSON-RPC requests.

**Headers:**
| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` (required) |
| `Mcp-Session-Id` | Session ID for persistent sessions (optional) |

**Response Headers:**
| Header | Description |
|--------|-------------|
| `Mcp-Session-Id` | Session ID to use for subsequent requests |

## JSON-RPC Methods

All requests use JSON-RPC 2.0 format.

### Initialize

Initialize a new MCP session.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "my-client",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "azure-devops-mcp",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

### List Tools

Get all available tools.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "list_work_items",
        "description": "Execute a raw WIQL query...",
        "inputSchema": { ... }
      },
      ...
    ]
  },
  "id": 2
}
```

### Call Tool

Execute a specific tool.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_projects",
    "arguments": {}
  },
  "id": 3
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{\"id\": \"...\", \"name\": \"MyProject\", ...}]"
      }
    ]
  },
  "id": 3
}
```

### Ping

Simple connectivity test.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "ping",
  "id": 4
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "pong": true
  },
  "id": 4
}
```

## Session Management

The server supports session management via the `Mcp-Session-Id` header.

1. **First request**: Don't include the header - server creates a new session
2. **Subsequent requests**: Include the `Mcp-Session-Id` from the response header
3. **Session timeout**: Sessions expire after 30 minutes of inactivity (configurable)

## Error Responses

**Invalid JSON-RPC Request:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid JSON-RPC request"
  },
  "id": null
}
```

**Method Not Found:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found: unknown_method"
  },
  "id": 1
}
```

**Internal Error:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Error message here"
  },
  "id": 1
}
```

## Examples

### curl Examples

**Health check:**
```bash
curl http://localhost:3000/health
```

**Initialize session:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

**List tools:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: your-session-id" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

**Call a tool (list projects):**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: your-session-id" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_projects","arguments":{}},"id":3}'
```

**Call a tool (list user stories):**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_user_stories","arguments":{"project":"MyProject"}},"id":4}'
```

### JavaScript/TypeScript Example

```typescript
async function callMcpTool(toolName: string, args: object) {
  const response = await fetch('http://localhost:3000/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Mcp-Session-Id': sessionId, // Optional
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
      id: Date.now(),
    }),
  });

  const result = await response.json();

  // Save session ID for future requests
  const newSessionId = response.headers.get('Mcp-Session-Id');
  if (newSessionId) {
    sessionId = newSessionId;
  }

  return result;
}

// Example usage
const projects = await callMcpTool('list_projects', {});
console.log(projects);
```

## CORS Configuration

The server supports CORS for browser-based clients. Configure allowed origins via the `MCP_CORS_ORIGINS` environment variable.

**Default allowed origins:**
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`

**Exposed headers:**
- `Mcp-Session-Id`

## Batch Requests

The server supports JSON-RPC batch requests. Send an array of requests:

```json
[
  {"jsonrpc":"2.0","method":"tools/list","id":1},
  {"jsonrpc":"2.0","method":"ping","id":2}
]
```

Response will be an array of results in the same order.
