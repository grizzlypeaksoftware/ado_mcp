# Azure DevOps MCP Server - Architecture

## Overview

The Azure DevOps MCP Server implements the Model Context Protocol (MCP) to expose Azure DevOps functionality as tools that can be called by AI assistants.

## Current Architecture (STDIO Transport)

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Client                                │
│                    (Claude, etc.)                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │ STDIO (stdin/stdout)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     src/index.ts                                 │
│                   (Entry Point)                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              StdioServerTransport                        │   │
│  │         (from @modelcontextprotocol/sdk)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MCP Server                            │   │
│  │  - ListToolsRequestSchema handler                        │   │
│  │  - CallToolRequestSchema handler                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Categories                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ work-items/  │ │    git/      │ │pull-requests/│  ...       │
│  │  index.ts    │ │  index.ts    │ │  index.ts    │            │
│  │  - tools[]   │ │  - tools[]   │ │  - tools[]   │            │
│  │  - handler() │ │  - handler() │ │  - handler() │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    src/ado-client.ts                             │
│                    (ADO API Client)                              │
│  - Authentication (PAT)                                          │
│  - API client instances (WorkItemTracking, Git, Build, etc.)    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Azure DevOps REST API                           │
│                 (via azure-devops-node-api)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Entry Point (`src/index.ts`)

The main entry point that:
- Validates environment variables (ADO_ORG_URL, ADO_PAT, ADO_PROJECT)
- Initializes the ADO client
- Creates the MCP Server instance
- Collects all tools from tool categories
- Sets up request handlers:
  - `ListToolsRequestSchema` - Returns array of all 106 tools
  - `CallToolRequestSchema` - Routes tool calls to appropriate handlers
- Connects via STDIO transport

### 2. ADO Client (`src/ado-client.ts`)

Wrapper around `azure-devops-node-api` that:
- Manages authentication via Personal Access Token
- Provides access to various API clients:
  - Work Item Tracking API
  - Git API
  - Build API
  - Release API
  - Test API
  - Task Agent API (for variable groups)
  - Policy API
- Handles default project resolution

### 3. Tool Categories (`src/tools/*/index.ts`)

Each category exports:
- **Tool definitions array**: Contains MCP tool schema with name, description, inputSchema
- **Handler function**: Routes tool name to specific implementation
- **Individual tool implementations**: Actual logic for each tool

### Tool Definition Structure

```typescript
export const exampleTool = {
  name: "tool_name",
  description: "What the tool does",
  inputSchema: {
    type: "object",
    properties: {
      param1: { type: "string", description: "..." },
      param2: { type: "number", description: "..." },
    },
    required: ["param1"],
  },
};
```

### Handler Structure

```typescript
export async function handleCategoryTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "tool_name":
      return toolImplementation(client, args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

## Request/Response Flow

1. **Client sends JSON-RPC request** via STDIO
2. **MCP Server receives request** and routes based on method:
   - `tools/list` → Returns all tool definitions
   - `tools/call` → Executes specific tool
3. **Tool handler called** with client and arguments
4. **Handler validates input** using Zod schemas
5. **Handler calls ADO API** via ado-client
6. **Result formatted** and returned as JSON-RPC response

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADO_ORG_URL` | Yes | Azure DevOps organization URL (e.g., `https://dev.azure.com/myorg`) |
| `ADO_PAT` | Yes | Personal Access Token for authentication |
| `ADO_PROJECT` | No | Default project name (can be overridden per-call) |

## Dependencies

- `@modelcontextprotocol/sdk` - MCP server SDK
- `azure-devops-node-api` - Official Azure DevOps API client
- `zod` - Input validation

## File Structure

```
src/
├── index.ts              # STDIO entry point
├── ado-client.ts         # Azure DevOps API client wrapper
├── types.ts              # Shared TypeScript types
└── tools/
    ├── work-items/       # 13 tools
    │   ├── index.ts
    │   ├── list-work-items.ts
    │   ├── get-work-item.ts
    │   └── ...
    ├── git/              # 10 tools
    ├── pull-requests/    # 11 tools
    ├── pipelines/        # 7 tools
    ├── builds/           # 6 tools
    ├── releases/         # 9 tools
    ├── links/            # 3 tools
    ├── attachments/      # 4 tools
    ├── boards/           # 5 tools
    ├── project/          # 7 tools
    ├── wiki/             # 7 tools
    ├── users/            # 3 tools
    ├── artifacts/        # 5 tools
    ├── test-plans/       # 7 tools
    ├── service-connections/ # 2 tools
    ├── variable-groups/  # 2 tools
    ├── notifications/    # 1 tool
    ├── dashboards/       # 2 tools
    └── policies/         # 2 tools
```
