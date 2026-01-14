# Azure DevOps MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Azure DevOps. This server enables AI assistants to manage work items, repositories, branches, commits, and more.

## Features

- **Work Items**: Query, create, update, delete work items, comments, linking, and attachments
- **Git Repositories**: List repos, branches, commits, and file contents
- **Pull Requests**: Full PR lifecycle, reviewers, comments, merging
- **Pipelines & Builds**: List, run, cancel pipelines and builds, view logs
- **Releases**: Release definitions, deployments, approvals
- **Boards**: Kanban boards, columns, swimlanes, card movement
- **Wiki**: Create, update, delete wiki pages
- **Test Plans**: Test plans, suites, cases, runs, and results
- **Artifacts**: Package feeds and packages
- **Project & Teams**: Projects, teams, iterations, area paths
- **Users & Notifications**: User search, notification subscriptions
- **Dashboards & Policies**: Dashboard management, branch policies

## Transport Modes

The server supports two transport modes:

| Mode | Use Case | Command |
|------|----------|---------|
| **STDIO** | Claude Desktop, VS Code, local CLI tools | `npm run start:stdio` |
| **HTTP** | Web apps, remote clients, SaaS deployment | `npm run start:http` |

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
| `MCP_HTTP_PORT` | No | HTTP server port (default: 3000) |
| `MCP_SESSION_TIMEOUT` | No | Session timeout in minutes (default: 30) |
| `MCP_CORS_ORIGINS` | No | Allowed CORS origins (comma-separated) |

### Generating a Personal Access Token

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Click "New Token"
3. Configure the following scopes:
   - **Work Items**: Read & Write
   - **Code**: Read & Write
   - **Build**: Read & Execute
   - **Release**: Read, Write & Execute
   - **Test Management**: Read & Write
   - **Wiki**: Read & Write
   - **Packaging**: Read
   - **Project and Team**: Read
   - **Service Connections**: Read
   - **Variable Groups**: Read
   - **Dashboard**: Read
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

### HTTP Mode

For web applications, remote clients, or when you want to run the server as a standalone service:

**Quick Start:**
```bash
# Set environment variables
export ADO_ORG_URL="https://dev.azure.com/your-org"
export ADO_PAT="your-pat-token"
export ADO_PROJECT="your-project"

# Start in HTTP mode
npm run start:http
```

**Test the server:**
```bash
# Health check
curl http://localhost:3000/health

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_projects","arguments":{}},"id":2}'
```

**Docker:**
```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t ado-mcp .
docker run -p 3000:3000 \
  -e ADO_ORG_URL="https://dev.azure.com/your-org" \
  -e ADO_PAT="your-pat-token" \
  ado-mcp
```

For detailed HTTP API documentation, see [docs/HTTP_API.md](docs/HTTP_API.md).

## Implementation Status

All 100 tools defined in the [full specification](azure-devops-mcp-spec.md) are now implemented.

| Category | Tools | Status |
|----------|-------|--------|
| Work Items (Core) | 23 | ✅ Complete |
| Work Item Linking | 3 | ✅ Complete |
| Work Item Attachments | 4 | ✅ Complete |
| Git Repositories | 10 | ✅ Complete |
| Pull Requests | 11 | ✅ Complete |
| Boards | 5 | ✅ Complete |
| Projects & Teams | 7 | ✅ Complete |
| Pipelines | 7 | ✅ Complete |
| Builds (Classic) | 6 | ✅ Complete |
| Releases | 9 | ✅ Complete |
| Wiki | 7 | ✅ Complete |
| Test Plans | 7 | ✅ Complete |
| Artifacts | 5 | ✅ Complete |
| Service Connections | 2 | ✅ Complete |
| Variable Groups | 2 | ✅ Complete |
| Users | 3 | ✅ Complete |
| Notifications | 1 | ✅ Complete |
| Dashboards | 2 | ✅ Complete |
| Branch Policies | 2 | ✅ Complete |

**Total: 116 tools implemented**

## Available Tools

### Work Items (Core)

| Tool | Description |
|------|-------------|
| `list_work_items` | Query work items using WIQL |
| `get_work_item` | Get full details of a work item |
| `create_work_item` | Create a new work item |
| `update_work_item` | Update an existing work item |
| `delete_work_item` | Delete or recycle a work item |
| `add_work_item_comment` | Add a comment to a work item |
| `search_work_items` | Search work items by keyword (requires search text) |
| `query_work_items` | Query work items with flexible filtering (no search text required) |
| `list_epics` | List Epic work items with optional filtering |
| `list_features` | List Feature work items with optional filtering |
| `list_user_stories` | List User Story work items with optional filtering |
| `list_bugs` | List Bug work items with optional filtering |
| `list_tasks` | List Task work items with optional filtering |
| `get_epic` | Get Epic details by ID with type validation |
| `get_feature` | Get Feature details by ID with type validation |
| `get_user_story` | Get User Story details with acceptance criteria and story points |
| `get_bug` | Get Bug details with repro steps, severity, and system info |
| `get_task` | Get Task details with work tracking fields |
| `create_epic` | Create an Epic with type-specific fields |
| `create_feature` | Create a Feature with optional parent Epic link |
| `create_user_story` | Create a User Story with acceptance criteria and story points |
| `create_bug` | Create a Bug with repro steps and severity |
| `create_task` | Create a Task with work estimates and activity type |

### Work Item Linking

| Tool | Description |
|------|-------------|
| `link_work_items` | Create a link between work items |
| `remove_work_item_link` | Remove a link between work items |
| `get_linked_work_items` | Get all linked work items |

### Work Item Attachments

| Tool | Description |
|------|-------------|
| `add_work_item_attachment` | Add file attachment from base64 |
| `add_work_item_attachment_from_url` | Add attachment from URL |
| `list_work_item_attachments` | List attachments on a work item |
| `remove_work_item_attachment` | Remove an attachment |

### Git Repositories

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

### Pull Requests

| Tool | Description |
|------|-------------|
| `list_pull_requests` | List pull requests with filters |
| `get_pull_request` | Get PR details |
| `create_pull_request` | Create a new pull request |
| `update_pull_request` | Update PR title/description/status |
| `add_pull_request_reviewer` | Add a reviewer to a PR |
| `remove_pull_request_reviewer` | Remove a reviewer from a PR |
| `add_pull_request_comment` | Add a comment to a PR |
| `get_pull_request_comments` | Get all comments on a PR |
| `complete_pull_request` | Complete/merge a PR |
| `get_pull_request_work_items` | Get linked work items |
| `link_pull_request_work_item` | Link a work item to a PR |

### Boards

| Tool | Description |
|------|-------------|
| `get_boards` | Get boards for a team |
| `get_board_columns` | Get columns for a board |
| `get_board_items` | Get items on a board |
| `move_board_card` | Move a card to a column/lane |
| `get_board_swimlanes` | Get swimlanes for a board |

### Projects & Teams

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `get_project` | Get project details |
| `list_teams` | List teams in a project |
| `get_team_members` | Get team members |
| `list_iterations` | List iterations for a team |
| `get_current_iteration` | Get the current iteration |
| `list_area_paths` | List area paths |

### Pipelines

| Tool | Description |
|------|-------------|
| `list_pipelines` | List YAML pipelines |
| `get_pipeline` | Get pipeline details |
| `list_pipeline_runs` | List pipeline runs |
| `get_pipeline_run` | Get run details |
| `run_pipeline` | Start a pipeline run |
| `cancel_pipeline_run` | Cancel a running pipeline |
| `get_pipeline_logs` | Get logs for a run |

### Builds (Classic)

| Tool | Description |
|------|-------------|
| `list_build_definitions` | List build definitions |
| `list_builds` | List builds |
| `get_build` | Get build details |
| `queue_build` | Queue a new build |
| `cancel_build` | Cancel a build |
| `get_build_logs` | Get build logs |

### Releases

| Tool | Description |
|------|-------------|
| `list_release_definitions` | List release definitions |
| `get_release_definition` | Get definition details |
| `list_releases` | List releases |
| `get_release` | Get release details |
| `create_release` | Create a new release |
| `deploy_release` | Deploy to an environment |
| `get_release_environment` | Get environment status |
| `approve_release` | Approve a deployment |
| `get_release_logs` | Get deployment logs |

### Wiki

| Tool | Description |
|------|-------------|
| `list_wikis` | List wikis in a project |
| `get_wiki` | Get wiki details |
| `get_wiki_page` | Get wiki page content |
| `create_wiki_page` | Create a new wiki page |
| `update_wiki_page` | Update a wiki page |
| `delete_wiki_page` | Delete a wiki page |
| `list_wiki_pages` | List pages in a wiki |

### Test Plans

| Tool | Description |
|------|-------------|
| `list_test_plans` | List test plans |
| `get_test_plan` | Get test plan details |
| `list_test_suites` | List test suites |
| `get_test_suite` | Get test suite details |
| `list_test_cases` | List test cases in a suite |
| `list_test_runs` | List test runs |
| `get_test_results` | Get test results |

### Artifacts

| Tool | Description |
|------|-------------|
| `list_feeds` | List artifact feeds |
| `get_feed` | Get feed details |
| `list_packages` | List packages in a feed |
| `get_package` | Get package details |
| `get_package_versions` | Get package versions |

### Service Connections

| Tool | Description |
|------|-------------|
| `list_service_connections` | List service connections |
| `get_service_connection` | Get connection details |

### Variable Groups

| Tool | Description |
|------|-------------|
| `list_variable_groups` | List variable groups |
| `get_variable_group` | Get group details with variables |

### Users

| Tool | Description |
|------|-------------|
| `get_current_user` | Get authenticated user info |
| `search_users` | Search for users |
| `get_user` | Get user details |

### Notifications

| Tool | Description |
|------|-------------|
| `list_subscriptions` | List notification subscriptions |

### Dashboards

| Tool | Description |
|------|-------------|
| `list_dashboards` | List dashboards |
| `get_dashboard` | Get dashboard with widgets |

### Branch Policies

| Tool | Description |
|------|-------------|
| `list_branch_policies` | List branch policies |
| `get_branch_policy` | Get policy details |

## Example Usage

### List Active Bugs (Simple)

```
Use list_bugs with:
- states: ["Active"]
```

### List All Epics in a Sprint

```
Use list_epics with:
- iterationPath: "MyProject\\Sprint 1"
- states: ["New", "Active"]
```

### Query Work Items with Flexible Filters

```
Use query_work_items with:
- workItemTypes: ["Bug", "Task"]
- states: ["Active"]
- assignedTo: "user@example.com"
- tags: ["priority-high"]
```

### Query Active Bugs (Advanced WIQL)

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

# Run in STDIO mode (for Claude Desktop, VS Code)
npm run start:stdio

# Run in HTTP mode (for web apps, remote clients)
npm run start:http

# Development mode (auto-rebuild)
npm run dev

# Development - HTTP mode with ts-node
npm run dev:http

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
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
