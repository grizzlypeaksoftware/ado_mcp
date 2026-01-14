# Migration Guide

This guide helps you migrate between versions of the Azure DevOps MCP Server.

## Migrating from v1.0.0 to v1.1.0

Version 1.1.0 introduces HTTP transport support while maintaining full backward compatibility with STDIO mode.

### No Breaking Changes

If you're currently using the server with Claude Desktop or VS Code in STDIO mode, **no changes are required**. The default behavior remains the same.

### What's New

#### Transport Modes

| Mode | Command | Use Case |
|------|---------|----------|
| STDIO | `npm run start:stdio` | Claude Desktop, VS Code, CLI tools |
| HTTP | `npm run start:http` | Web apps, remote clients, SaaS |

#### New Environment Variables

```bash
# HTTP-specific (only needed for HTTP mode)
MCP_HTTP_PORT=3000              # Server port (default: 3000)
MCP_SESSION_TIMEOUT=30          # Session timeout in minutes (default: 30)
MCP_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Upgrading Steps

#### For STDIO Users (Claude Desktop, VS Code)

1. **Pull latest changes:**
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

2. **No configuration changes needed** - Your existing setup continues to work.

#### For New HTTP Deployments

1. **Pull latest changes:**
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

2. **Configure environment:**
   ```bash
   # Copy example configuration
   cp .env.example .env

   # Edit with your settings
   nano .env
   ```

3. **Start in HTTP mode:**
   ```bash
   npm run start:http
   ```

4. **Test the server:**
   ```bash
   curl http://localhost:3000/health
   ```

#### For Docker Deployments

1. **Build the image:**
   ```bash
   docker build -t ado-mcp .
   ```

2. **Run with docker-compose:**
   ```bash
   docker-compose up -d
   ```

   Or run directly:
   ```bash
   docker run -p 3000:3000 \
     -e ADO_ORG_URL="https://dev.azure.com/your-org" \
     -e ADO_PAT="your-pat-token" \
     -e ADO_PROJECT="your-project" \
     ado-mcp
   ```

### API Compatibility

All 106 tools remain fully compatible. The HTTP transport exposes the same tools with identical parameters and responses.

#### Tool Call Format (HTTP)

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
    "id": 1
  }'
```

### Session Management (HTTP Mode)

HTTP mode includes session management for stateful interactions:

1. **First request** creates a session automatically
2. **Session ID** returned in `Mcp-Session-Id` response header
3. **Subsequent requests** should include `Mcp-Session-Id` header
4. **Sessions expire** after configured timeout (default: 30 minutes)

```bash
# Get session ID from first request
SESSION_ID=$(curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}' \
  -D - 2>&1 | grep -i "mcp-session-id" | cut -d' ' -f2 | tr -d '\r')

# Use session in subsequent requests
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

### Troubleshooting

#### STDIO mode not working after upgrade

Ensure you're using the correct start command:
```bash
npm run start:stdio  # or just: npm start
```

#### HTTP mode connection refused

1. Check port availability:
   ```bash
   netstat -an | grep 3000
   ```

2. Verify environment variables are set:
   ```bash
   echo $ADO_ORG_URL
   echo $ADO_PAT
   ```

3. Check server logs for errors

#### CORS errors in browser

Add your origin to `MCP_CORS_ORIGINS`:
```bash
export MCP_CORS_ORIGINS="http://localhost:3000,http://your-app.com"
```

### Getting Help

- Check [docs/HTTP_API.md](HTTP_API.md) for API reference
- See [docs/MANUAL_TEST_PLAN.md](MANUAL_TEST_PLAN.md) for testing procedures
- Review [docs/ARCHITECTURE.md](ARCHITECTURE.md) for system design
- File issues at: https://github.com/your-org/azure-devops-mcp/issues
