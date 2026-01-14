# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-01-13

### Added

- **HTTP Transport Support**: New streamable HTTP transport alongside existing STDIO transport
  - JSON-RPC 2.0 over HTTP POST at `/mcp` endpoint
  - Health check endpoint at `/health`
  - Session management with configurable timeout via `Mcp-Session-Id` header
  - CORS support for browser-based clients

- **New npm scripts**:
  - `npm run start:stdio` - Start server in STDIO mode (default, for Claude Desktop)
  - `npm run start:http` - Start server in HTTP mode (for web apps, remote clients)
  - `npm run dev:stdio` - Development mode with ts-node (STDIO)
  - `npm run dev:http` - Development mode with ts-node (HTTP)

- **Docker support**:
  - `Dockerfile` for containerized deployment
  - `docker-compose.yml` for easy deployment

- **New environment variables**:
  - `MCP_HTTP_PORT` - HTTP server port (default: 3000)
  - `MCP_SESSION_TIMEOUT` - Session timeout in minutes (default: 30)
  - `MCP_CORS_ORIGINS` - Comma-separated list of allowed CORS origins

- **Documentation**:
  - `docs/HTTP_API.md` - HTTP API reference
  - `docs/ARCHITECTURE.md` - System architecture documentation
  - `docs/TOOL_INVENTORY.md` - Complete tool inventory
  - `docs/MANUAL_TEST_PLAN.md` - Manual testing procedures
  - `.env.example` - Environment configuration template

- **Testing**:
  - HTTP transport unit tests
  - HTTP integration tests with supertest

### Changed

- Default `npm start` now runs STDIO mode (backward compatible)
- README updated with HTTP mode documentation and VS Code configuration

### Fixed

- N/A (new feature release)

## [1.0.0] - 2025-01-01

### Added

- Initial release with STDIO transport
- 106 Azure DevOps tools across 19 categories:
  - Work Items (13 tools): CRUD, comments, queries
  - Work Item Linking (3 tools): parent/child, related links
  - Work Item Attachments (4 tools): file attachments
  - Git Repositories (10 tools): repos, branches, commits, files
  - Pull Requests (11 tools): PR lifecycle, reviewers, comments
  - Boards (5 tools): Kanban boards, columns, swimlanes
  - Projects & Teams (7 tools): project and team management
  - Pipelines (7 tools): YAML pipelines, runs, logs
  - Builds (6 tools): Classic build definitions
  - Releases (9 tools): Release management, approvals
  - Wiki (7 tools): Wiki page CRUD
  - Test Plans (7 tools): Test management
  - Artifacts (5 tools): Package feeds
  - Service Connections (2 tools): Endpoints
  - Variable Groups (2 tools): Pipeline variables
  - Users (3 tools): User management
  - Notifications (1 tool): Subscriptions
  - Dashboards (2 tools): Dashboard widgets
  - Branch Policies (2 tools): Policy configuration

### Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK
- `azure-devops-node-api` - Azure DevOps API client
- TypeScript 5.x
- Node.js 18+

---

[Unreleased]: https://github.com/your-org/azure-devops-mcp/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/your-org/azure-devops-mcp/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your-org/azure-devops-mcp/releases/tag/v1.0.0
