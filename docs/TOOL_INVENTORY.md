# Azure DevOps MCP Server - Tool Inventory

**Total Tools: 106**

## Tool Categories

| Category | Count | Directory |
|----------|-------|-----------|
| Work Items | 13 | `src/tools/work-items/` |
| Git Repositories | 10 | `src/tools/git/` |
| Pull Requests | 11 | `src/tools/pull-requests/` |
| Pipelines | 7 | `src/tools/pipelines/` |
| Builds | 6 | `src/tools/builds/` |
| Releases | 9 | `src/tools/releases/` |
| Work Item Links | 3 | `src/tools/links/` |
| Work Item Attachments | 4 | `src/tools/attachments/` |
| Boards | 5 | `src/tools/boards/` |
| Projects & Teams | 7 | `src/tools/project/` |
| Wiki | 7 | `src/tools/wiki/` |
| Users | 3 | `src/tools/users/` |
| Artifacts | 5 | `src/tools/artifacts/` |
| Test Plans | 7 | `src/tools/test-plans/` |
| Service Connections | 2 | `src/tools/service-connections/` |
| Variable Groups | 2 | `src/tools/variable-groups/` |
| Notifications | 1 | `src/tools/notifications/` |
| Dashboards | 2 | `src/tools/dashboards/` |
| Branch Policies | 2 | `src/tools/policies/` |

## Detailed Tool List

### Work Items (13 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_work_items` | Execute WIQL query to list work items |
| `get_work_item` | Get detailed work item by ID |
| `create_work_item` | Create new work item |
| `update_work_item` | Update existing work item |
| `delete_work_item` | Delete work item |
| `add_work_item_comment` | Add comment to work item |
| `search_work_items` | Search work items by text |
| `query_work_items` | Query work items with filters |
| `list_epics` | List Epic work items |
| `list_features` | List Feature work items |
| `list_user_stories` | List User Story work items |
| `list_bugs` | List Bug work items |
| `list_tasks` | List Task work items |

### Git Repositories (10 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_repositories` | List Git repositories |
| `get_repository` | Get repository details |
| `list_branches` | List branches in repository |
| `get_branch` | Get branch details |
| `list_commits` | List commit history |
| `get_commit` | Get commit details |
| `get_file_content` | Get file content from repo |
| `list_files` | List files in repository |
| `create_branch` | Create new branch |
| `delete_branch` | Delete branch |

### Pull Requests (11 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_pull_requests` | List pull requests |
| `get_pull_request` | Get PR details |
| `create_pull_request` | Create new PR |
| `update_pull_request` | Update PR |
| `add_pull_request_reviewer` | Add reviewer to PR |
| `remove_pull_request_reviewer` | Remove reviewer from PR |
| `add_pull_request_comment` | Add comment to PR |
| `get_pull_request_comments` | Get PR comments |
| `complete_pull_request` | Complete/merge PR |
| `get_pull_request_work_items` | Get linked work items |
| `link_pull_request_work_item` | Link work item to PR |

### Pipelines (7 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_pipelines` | List YAML pipelines |
| `get_pipeline` | Get pipeline details |
| `list_pipeline_runs` | List pipeline runs |
| `get_pipeline_run` | Get run details |
| `run_pipeline` | Trigger pipeline run |
| `cancel_pipeline_run` | Cancel running pipeline |
| `get_pipeline_logs` | Get pipeline logs |

### Builds (6 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_build_definitions` | List build definitions |
| `list_builds` | List builds |
| `get_build` | Get build details |
| `queue_build` | Queue new build |
| `cancel_build` | Cancel build |
| `get_build_logs` | Get build logs |

### Releases (9 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_release_definitions` | List release definitions |
| `get_release_definition` | Get release definition details |
| `list_releases` | List releases |
| `get_release` | Get release details |
| `create_release` | Create new release |
| `deploy_release` | Deploy release to environment |
| `get_release_environment` | Get environment status |
| `approve_release` | Approve/reject release |
| `get_release_logs` | Get release logs |

### Work Item Links (3 tools)
| Tool Name | Description |
|-----------|-------------|
| `link_work_items` | Create link between work items |
| `remove_work_item_link` | Remove link between work items |
| `get_linked_work_items` | Get linked work items |

### Work Item Attachments (4 tools)
| Tool Name | Description |
|-----------|-------------|
| `add_work_item_attachment` | Add file attachment |
| `add_work_item_attachment_from_url` | Add attachment from URL |
| `list_work_item_attachments` | List attachments |
| `remove_work_item_attachment` | Remove attachment |

### Boards (5 tools)
| Tool Name | Description |
|-----------|-------------|
| `get_boards` | List Kanban boards |
| `get_board_columns` | Get board columns |
| `get_board_items` | Get items on board |
| `move_board_card` | Move card on board |
| `get_board_swimlanes` | Get board swimlanes |

### Projects & Teams (7 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_projects` | List projects |
| `get_project` | Get project details |
| `list_teams` | List teams |
| `get_team_members` | Get team members |
| `list_iterations` | List iterations/sprints |
| `get_current_iteration` | Get current iteration |
| `list_area_paths` | List area paths |

### Wiki (7 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_wikis` | List wikis |
| `get_wiki` | Get wiki details |
| `get_wiki_page` | Get wiki page content |
| `create_wiki_page` | Create wiki page |
| `update_wiki_page` | Update wiki page |
| `delete_wiki_page` | Delete wiki page |
| `list_wiki_pages` | List wiki pages |

### Users (3 tools)
| Tool Name | Description |
|-----------|-------------|
| `get_current_user` | Get current user |
| `search_users` | Search for users |
| `get_user` | Get user details |

### Artifacts (5 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_feeds` | List artifact feeds |
| `get_feed` | Get feed details |
| `list_packages` | List packages in feed |
| `get_package` | Get package details |
| `get_package_versions` | Get package versions |

### Test Plans (7 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_test_plans` | List test plans |
| `get_test_plan` | Get test plan details |
| `list_test_suites` | List test suites |
| `get_test_suite` | Get test suite details |
| `list_test_cases` | List test cases |
| `get_test_results` | Get test results |
| `list_test_runs` | List test runs |

### Service Connections (2 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_service_connections` | List service connections |
| `get_service_connection` | Get connection details |

### Variable Groups (2 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_variable_groups` | List variable groups |
| `get_variable_group` | Get variable group details |

### Notifications (1 tool)
| Tool Name | Description |
|-----------|-------------|
| `list_subscriptions` | List notification subscriptions |

### Dashboards (2 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_dashboards` | List dashboards |
| `get_dashboard` | Get dashboard details |

### Branch Policies (2 tools)
| Tool Name | Description |
|-----------|-------------|
| `list_branch_policies` | List branch policies |
| `get_branch_policy` | Get policy details |
