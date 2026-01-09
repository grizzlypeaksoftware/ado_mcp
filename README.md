# Azure DevOps MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Azure DevOps. This server enables AI assistants to manage work items, repositories, branches, commits, and more.

## Features

- **Work Items**: Query, create, update, delete work items and add comments
- **Git Repositories**: List repos, branches, commits, and file contents
- **Branch Management**: Create and delete branches
- **Project Information**: List projects and get project details

## Prerequisites

- Node.js 18 or higher
- An Azure DevOps organization
- A Personal Access Token (PAT) with appropriate permissions

## Installation

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADO_PAT` | Yes | Personal Access Token |
| `ADO_ORG_URL` | Yes | Organization URL (e.g., `https://dev.azure.com/myorg`) |
| `ADO_PROJECT` | No | Default project name |

### Generating a Personal Access Token

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Click "New Token"
3. Configure the following scopes:
   - **Work Items**: Read & Write
   - **Code**: Read & Write
   - **Project and Team**: Read
4. Copy the generated token

### Claude Desktop Configuration

Add to your `claude_desktop_config.json` (typically located at `%APPDATA%\Claude\claude_desktop_config.json` on Windows or `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "node",
      "args": ["C:/path/to/azure-devops-mcp/dist/index.js"],
      "env": {
        "ADO_PAT": "your-pat-token",
        "ADO_ORG_URL": "https://dev.azure.com/your-org",
        "ADO_PROJECT": "your-default-project"
      }
    }
  }
}
```

### VS Code with GitHub Copilot Configuration

To use this MCP server with GitHub Copilot in VS Code:

1. **Enable MCP support in VS Code** (requires GitHub Copilot Chat extension):
   - Open VS Code Settings (Ctrl+, or Cmd+,)
   - Search for "mcp"
   - Enable `GitHub > Copilot > Chat > MCP: Enabled`

2. **Configure the MCP server** by adding to your VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "azure-devops": {
      "command": "node",
      "args": ["C:/path/to/azure-devops-mcp/dist/index.js"],
      "env": {
        "ADO_PAT": "your-pat-token",
        "ADO_ORG_URL": "https://dev.azure.com/your-org",
        "ADO_PROJECT": "your-default-project"
      }
    }
  }
}
```

Alternatively, create a `.vscode/mcp.json` file in your workspace:

```json
{
  "servers": {
    "azure-devops": {
      "command": "node",
      "args": ["C:/path/to/azure-devops-mcp/dist/index.js"],
      "env": {
        "ADO_PAT": "your-pat-token",
        "ADO_ORG_URL": "https://dev.azure.com/your-org",
        "ADO_PROJECT": "your-default-project"
      }
    }
  }
}
```

3. **Restart VS Code** after configuration changes.

4. **Use the tools** in GitHub Copilot Chat by asking questions like:
   - "List all active bugs in Azure DevOps"
   - "Create a new task titled 'Fix login bug'"
   - "Show me the branches in the main repository"

> **Note**: MCP support in GitHub Copilot requires the latest version of the GitHub Copilot Chat extension. If you don't see MCP settings, update your extension.

## Implementation Status

This is an MVP implementation covering 20 of the 100 tools defined in the [full specification](azure-devops-mcp-spec.md).

### Implemented

| Category | Tools | Status |
|----------|-------|--------|
| Work Items (Core) | 7 | ✅ Complete |
| Git Repositories | 10 | ✅ Complete |
| Projects | 2 | ✅ Complete |
| Users | 1 | ✅ Complete |

### Not Yet Implemented

| Category | Tools | Description |
|----------|-------|-------------|
| Work Item Linking | 3 | link_work_items, remove_work_item_link, get_linked_work_items |
| Work Item Attachments | 4 | add/remove attachments, list attachments |
| Boards | 5 | get boards, columns, swimlanes, move cards |
| Teams & Iterations | 5 | list_teams, get_team_members, iterations, area_paths |
| Pull Requests | 11 | Full PR lifecycle, reviewers, comments, merging |
| Pipelines | 7 | list/run/cancel pipelines, get logs |
| Builds (Classic) | 6 | list/queue/cancel builds, get logs |
| Releases | 9 | release definitions, deployments, approvals |
| Wiki | 7 | wiki pages CRUD |
| Test Plans | 7 | test plans, suites, cases, runs, results |
| Artifacts | 5 | feeds and packages |
| Service Connections | 2 | list and get service endpoints |
| Variable Groups | 2 | list and get variable groups |
| Users (Extended) | 2 | search_users, get_user |
| Notifications | 1 | list_subscriptions |
| Dashboards | 2 | list and get dashboards |
| Branch Policies | 2 | list and get policies |

**Total: 20 implemented / 100 specified**

## Available Tools

### Work Items

| Tool | Description |
|------|-------------|
| `list_work_items` | Query work items using WIQL |
| `get_work_item` | Get full details of a work item |
| `create_work_item` | Create a new work item |
| `update_work_item` | Update an existing work item |
| `delete_work_item` | Delete or recycle a work item |
| `add_work_item_comment` | Add a comment to a work item |
| `search_work_items` | Search work items by keyword |

### Git

| Tool | Description |
|------|-------------|
| `list_repositories` | List all repositories in a project |
| `get_repository` | Get repository details |
| `list_branches` | List branches in a repository |
| `get_branch` | Get branch details with latest commit |
| `list_commits` | List commits in a repository |
| `get_commit` | Get commit details with file changes |
| `get_file_content` | Get content of a file |
| `list_files` | List files in a repository path |
| `create_branch` | Create a new branch |
| `delete_branch` | Delete a branch |

### Projects

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects in the organization |
| `get_project` | Get project details |
| `get_current_user` | Get authenticated user info |

## Example Usage

### Query Active Bugs

```
Use list_work_items with query:
"SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.State] = 'Active'"
```

### Create a Task

```
Use create_work_item with:
- type: "Task"
- title: "Implement feature X"
- description: "Details about the task"
- assignedTo: "user@example.com"
```

### List Repository Branches

```
Use list_branches with:
- repository: "my-repo"
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run dev
```

## Troubleshooting

### Common PAT Issues

- **401 Unauthorized**: PAT may be expired or invalid
- **403 Forbidden**: PAT lacks required scope permissions
- **404 Not Found**: Project or resource doesn't exist, or PAT can't access it

### Connection Issues

1. Verify `ADO_ORG_URL` is correct (should be `https://dev.azure.com/orgname`)
2. Ensure PAT hasn't expired
3. Check that PAT has access to the target project

## License

MIT
