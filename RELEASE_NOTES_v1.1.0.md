# Release v1.1.0 - HTTP Transport Support

This release introduces HTTP transport support, enabling the Azure DevOps MCP Server to be used with web applications, remote clients, and SaaS deployments while maintaining full backward compatibility with STDIO mode.

## Highlights

### Dual Transport Support
- **STDIO Mode**: Continue using with Claude Desktop and VS Code (no changes required)
- **HTTP Mode**: New streamable HTTP transport for web apps and remote clients

### Docker Ready
- Dockerfile for containerized deployments
- docker-compose.yml for easy setup

### Comprehensive Documentation
- HTTP API reference
- Architecture documentation
- Migration guide
- Manual test plan

## What's New

### HTTP Transport
- JSON-RPC 2.0 over HTTP POST at `/mcp` endpoint
- Health check endpoint at `/health`
- Session management with `Mcp-Session-Id` header
- Configurable CORS for browser clients

### New Commands
```bash
npm run start:http     # Start in HTTP mode
npm run dev:http       # Development mode (HTTP)
```

### New Environment Variables
```bash
MCP_HTTP_PORT=3000           # HTTP server port
MCP_SESSION_TIMEOUT=30       # Session timeout (minutes)
MCP_CORS_ORIGINS=...         # Allowed CORS origins
```

## Quick Start

### STDIO Mode (Claude Desktop)
```bash
npm install && npm run build
npm run start:stdio
```

### HTTP Mode
```bash
export ADO_ORG_URL="https://dev.azure.com/your-org"
export ADO_PAT="your-pat-token"
npm run start:http
```

### Docker
```bash
docker-compose up -d
```

## Compatibility

- All 106 Azure DevOps tools work identically in both modes
- No changes to tool parameters or responses
- Existing STDIO configurations continue to work

## Documentation

- [HTTP API Reference](docs/HTTP_API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)
- [Contributing](CONTRIBUTING.md)

## Upgrade Instructions

For existing STDIO users: No changes required. Your configuration continues to work.

For new HTTP deployments: See [Migration Guide](docs/MIGRATION_GUIDE.md).

---

**Full Changelog**: See [CHANGELOG.md](CHANGELOG.md)
