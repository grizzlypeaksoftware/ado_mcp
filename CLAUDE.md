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
| `work-items/` | WIQL queries, CRUD operations, comments, type-specific tools |
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

### Utilities

- **`src/utils/html-to-text.ts`** - Converts HTML descriptions to plain text for better readability

### Type-Specific Work Item Tools

The server provides type-specific tools for common work item types (Epic, Feature, User Story, Bug, Task):
- **Get tools** (`get_epic`, `get_feature`, etc.) - Fetch work item details with type validation
- **Create tools** (`create_epic`, `create_feature`, etc.) - Create work items with type-specific fields
- These tools use shared helpers in `get-typed-work-item.ts` and `create-typed-work-item.ts`

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

## Project Planning and Management

When the user requests a new feature or significant work, follow this workflow using the Azure DevOps MCP tools:

### 1. Create a Feature in Azure DevOps

- Use `create_feature` to create a Feature work item for any significant new functionality
- Include a clear title and description of the feature scope
- **Ask the user before creating** the feature to confirm scope and approach

### 2. Create User Stories for All Work

Every piece of work should be tracked as a User Story linked to the parent Feature. Create separate stories for:

- **Planning & Design** - Architecture decisions, approach planning, research
- **Implementation** - Core code changes (may be multiple stories for large features)
- **Testing** - Unit tests, integration tests, test coverage
- **Documentation** - README updates, code comments, CLAUDE.md updates
- **Any other work** - All tasks should have a corresponding story

Use `create_user_story` with `parentId` set to the Feature ID to maintain hierarchy.

### 3. Work Items One at a Time

- Focus on one User Story at a time
- Update the story state as work progresses (New → Active → Resolved → Closed)
- Use `update_work_item` to track progress
- Complete and close each story before moving to the next

### 4. Ask Before Adding Work Items

- **Always ask** the user before creating a new Feature
- **Occasionally ask** before adding User Stories, especially if:
  - The scope seems larger than expected
  - New requirements emerge during implementation
  - The story might be out of scope for the current feature
- When in doubt, confirm with the user

### 5. Keep Work Items Updated

- Update story descriptions if requirements change
- Add comments to work items for significant decisions or blockers
- Close stories promptly when complete

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
