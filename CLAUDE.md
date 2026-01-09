# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for Azure DevOps that provides tools for managing work items, repositories, pipelines, pull requests, wikis, and more. The server is written in TypeScript and uses the official MCP SDK.

## Build and Test Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Architecture

### Core Components

- **`src/index.ts`** - MCP server entry point, handles stdio transport
- **`src/ado-client.ts`** - Azure DevOps API client wrapper with authentication
- **`src/types.ts`** - Shared TypeScript types and interfaces

### Tool Categories

Tools are organized by domain in `src/tools/`:

| Directory | Purpose |
|-----------|---------|
| `work-items/` | WIQL queries, CRUD operations, comments |
| `links/` | Work item linking (parent/child, related, etc.) |
| `attachments/` | File attachments on work items |
| `boards/` | Kanban boards, columns, swimlanes, card movement |
| `project/` | Projects, teams, iterations, area paths |
| `git/` | Repositories, branches, commits, file content |
| `pull-requests/` | PR lifecycle, reviewers, comments, merging |
| `pipelines/` | YAML pipelines, runs, logs |
| `builds/` | Classic build definitions and builds |
| `releases/` | Release definitions, deployments, approvals |
| `wiki/` | Wiki pages CRUD |
| `test-plans/` | Test plans, suites, cases, runs, results |
| `artifacts/` | Package feeds and packages |
| `service-connections/` | Service endpoints |
| `variable-groups/` | Pipeline variable groups |
| `users/` | User search and identity |
| `dashboards/` | Dashboards and widgets |
| `policies/` | Branch policies |

### Authentication

The server uses Personal Access Tokens (PAT) via environment variables:
- `ADO_PAT` - Personal Access Token (required)
- `ADO_ORG_URL` - Organization URL, e.g., `https://dev.azure.com/myorg` (required)
- `ADO_PROJECT` - Default project name (optional, can be overridden per-call)

### Key Dependencies

- `azure-devops-node-api` - Official Azure DevOps API client
- `@modelcontextprotocol/sdk` - MCP server SDK
- `jest` - Testing framework

## Testing Guidelines

- Mock `azure-devops-node-api` client for unit tests
- Use dependency injection for the ADO client to enable mocking
- Test fixtures in `tests/mocks/`
- Coverage requirements: 80% overall, 100% on validation and error handling

## Implementation Order

When implementing new features, follow this dependency order:
1. Project/Team operations (foundational)
2. Work items and linking
3. Git operations
4. Pull requests
5. Pipelines and builds
6. Releases
7. Wiki, tests, artifacts
8. Remaining utilities (users, dashboards, policies)
