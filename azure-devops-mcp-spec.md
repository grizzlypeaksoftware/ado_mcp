# MCP Server Spec: Azure DevOps (Full-Featured)

## Overview
Build a comprehensive MCP server that connects to Azure DevOps and provides tools for managing work items, repositories, pipelines, pull requests, wikis, and more. The server should be written in TypeScript and use the official MCP SDK.

## Authentication
- Accept a Personal Access Token (PAT) via environment variable `ADO_PAT`
- Accept the Azure DevOps organization URL via environment variable `ADO_ORG_URL` (e.g., `https://dev.azure.com/myorg`)
- Accept a default project name via environment variable `ADO_PROJECT` (optional, can be overridden per-call)

---

## Tools to Implement

---

### Work Item Core Operations

#### 1. list_work_items
- Query work items using WIQL (Work Item Query Language)
- Parameters:
  - `query` (string, required): WIQL query string
  - `project` (string, optional): Project name, defaults to `ADO_PROJECT`
- Returns: Array of work item summaries (id, title, state, type, assigned to)

#### 2. get_work_item
- Fetch a single work item with full details
- Parameters:
  - `id` (number, required): Work item ID
  - `includeRelations` (boolean, optional): Include linked items, default true
  - `includeAttachments` (boolean, optional): Include attachment info, default true
- Returns: Full work item object including all fields, comments, relations, and attachments

#### 3. create_work_item
- Create a new work item
- Parameters:
  - `project` (string, optional): Project name
  - `type` (string, required): Work item type (Bug, Task, User Story, Epic, Feature, etc.)
  - `title` (string, required): Title
  - `description` (string, optional): Description/repro steps
  - `assignedTo` (string, optional): Email or display name
  - `areaPath` (string, optional): Area path
  - `iterationPath` (string, optional): Iteration/sprint path
  - `parentId` (number, optional): Parent work item ID to link to
  - `tags` (string[], optional): Tags to apply
  - `priority` (number, optional): Priority (1-4)
  - `additionalFields` (object, optional): Key-value pairs for custom fields
- Returns: Created work item with ID

#### 4. update_work_item
- Update an existing work item
- Parameters:
  - `id` (number, required): Work item ID
  - `title` (string, optional)
  - `description` (string, optional)
  - `state` (string, optional): New state
  - `assignedTo` (string, optional)
  - `areaPath` (string, optional)
  - `iterationPath` (string, optional)
  - `tags` (string[], optional)
  - `priority` (number, optional)
  - `additionalFields` (object, optional)
- Returns: Updated work item

#### 5. delete_work_item
- Delete or recycle a work item
- Parameters:
  - `id` (number, required): Work item ID
  - `permanent` (boolean, optional): Permanently delete vs send to recycle bin, default false
- Returns: Confirmation

#### 6. add_work_item_comment
- Add a comment to a work item
- Parameters:
  - `id` (number, required): Work item ID
  - `text` (string, required): Comment text (supports HTML)
- Returns: Created comment

#### 7. search_work_items
- Simple keyword search (wraps WIQL for convenience)
- Parameters:
  - `searchText` (string, required): Text to search for
  - `project` (string, optional)
  - `workItemTypes` (string[], optional): Filter by types
  - `states` (string[], optional): Filter by states
  - `assignedTo` (string, optional): Filter by assignee
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of matching work items

---

### Work Item Linking Operations

#### 8. link_work_items
- Create a link between two work items
- Parameters:
  - `sourceId` (number, required): Source work item ID
  - `targetId` (number, required): Target work item ID
  - `linkType` (string, required): One of:
    - `parent` — target becomes parent of source
    - `child` — target becomes child of source
    - `related` — general relation
    - `predecessor` — target must complete before source
    - `successor` — source must complete before target
    - `duplicate` — source duplicates target
    - `duplicate-of` — source is duplicate of target
    - `tests` — source tests target (for test cases)
    - `tested-by` — source is tested by target
  - `comment` (string, optional): Comment describing the link
- Returns: Confirmation with link details

#### 9. remove_work_item_link
- Remove a link between work items
- Parameters:
  - `sourceId` (number, required): Source work item ID
  - `targetId` (number, required): Target work item ID
  - `linkType` (string, required): Link type to remove
- Returns: Confirmation

#### 10. get_linked_work_items
- Get all work items linked to a specific item
- Parameters:
  - `id` (number, required): Work item ID
  - `linkType` (string, optional): Filter by link type
- Returns: Array of linked work items with link type info

---

### Work Item Attachment Operations

#### 11. add_work_item_attachment
- Add an attachment to a work item
- Parameters:
  - `id` (number, required): Work item ID
  - `filePath` (string, required): Path to file to upload
  - `fileName` (string, optional): Override filename
  - `comment` (string, optional): Attachment comment
- Returns: Attachment details with URL

#### 12. add_work_item_attachment_from_url
- Attach a file from a URL to a work item
- Parameters:
  - `id` (number, required): Work item ID
  - `url` (string, required): URL of file to attach
  - `fileName` (string, required): Name for the attachment
  - `comment` (string, optional): Attachment comment
- Returns: Attachment details

#### 13. list_work_item_attachments
- List all attachments on a work item
- Parameters:
  - `id` (number, required): Work item ID
- Returns: Array of attachments with name, size, URL, upload date

#### 14. remove_work_item_attachment
- Remove an attachment from a work item
- Parameters:
  - `id` (number, required): Work item ID
  - `attachmentId` (string, required): Attachment ID or URL
- Returns: Confirmation

---

### Board Operations

#### 15. get_boards
- List all boards in a project
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional): Team name, defaults to project default team
- Returns: Array of boards with ID, name, columns

#### 16. get_board_columns
- Get columns for a specific board
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional)
  - `board` (string, required): Board name or ID
- Returns: Array of columns with name, item limit, state mappings

#### 17. get_board_items
- Get all work items on a board
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional)
  - `board` (string, required): Board name or ID
  - `column` (string, optional): Filter by column
  - `swimlane` (string, optional): Filter by swimlane
- Returns: Array of work items with board position info

#### 18. move_board_card
- Move a work item card on the board
- Parameters:
  - `id` (number, required): Work item ID
  - `project` (string, optional)
  - `team` (string, optional)
  - `board` (string, required): Board name or ID
  - `column` (string, required): Target column name
  - `position` (number, optional): Position within column (0-indexed)
  - `swimlane` (string, optional): Target swimlane
- Returns: Updated card position

#### 19. get_board_swimlanes
- Get swimlanes for a board
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional)
  - `board` (string, required): Board name or ID
- Returns: Array of swimlanes

---

### Project & Team Operations

#### 20. list_projects
- List all projects in the organization
- Parameters:
  - `stateFilter` (string, optional): `wellFormed`, `createPending`, `deleting`, `new`, `all` (default)
- Returns: Array of projects with ID, name, description, state

#### 21. get_project
- Get details for a specific project
- Parameters:
  - `project` (string, required): Project name or ID
  - `includeCapabilities` (boolean, optional): Include version control and process template info
- Returns: Full project details

#### 22. list_teams
- List teams in a project
- Parameters:
  - `project` (string, optional)
- Returns: Array of teams with ID, name, description

#### 23. get_team_members
- Get members of a team
- Parameters:
  - `project` (string, optional)
  - `team` (string, required): Team name or ID
- Returns: Array of team members with identity info

#### 24. list_iterations
- List iterations/sprints for a project
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional)
  - `timeframe` (string, optional): `past`, `current`, `future`, or `all` (default)
- Returns: Array of iterations with path, start date, end date, state

#### 25. get_current_iteration
- Get the current active iteration
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional)
- Returns: Current iteration details

#### 26. list_area_paths
- List area paths for a project
- Parameters:
  - `project` (string, optional)
  - `depth` (number, optional): How deep to traverse, default 3
- Returns: Hierarchical list of area paths

---

### Git Repository Operations

#### 27. list_repositories
- List all Git repositories in a project
- Parameters:
  - `project` (string, optional)
- Returns: Array of repositories with ID, name, URL, default branch

#### 28. get_repository
- Get details for a specific repository
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
- Returns: Full repository details

#### 29. list_branches
- List branches in a repository
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `filter` (string, optional): Filter branches by name prefix
- Returns: Array of branches with name, commit info, ahead/behind counts

#### 30. get_branch
- Get details for a specific branch
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `branch` (string, required): Branch name
- Returns: Branch details with latest commit info

#### 31. list_commits
- List commits in a repository
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `branch` (string, optional): Branch name, defaults to default branch
  - `author` (string, optional): Filter by author email
  - `fromDate` (string, optional): Start date (ISO format)
  - `toDate` (string, optional): End date (ISO format)
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of commits with ID, message, author, date

#### 32. get_commit
- Get details for a specific commit
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `commitId` (string, required): Commit SHA
  - `includeChanges` (boolean, optional): Include file changes, default true
- Returns: Full commit details with changes

#### 33. get_file_content
- Get content of a file from repository
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `path` (string, required): File path in repository
  - `branch` (string, optional): Branch name, defaults to default branch
  - `commitId` (string, optional): Specific commit SHA
- Returns: File content (text or base64 for binary)

#### 34. list_files
- List files and folders in a repository path
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `path` (string, optional): Folder path, defaults to root
  - `branch` (string, optional): Branch name
  - `recursive` (boolean, optional): List recursively, default false
- Returns: Array of files/folders with path, type, size

#### 35. create_branch
- Create a new branch
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `name` (string, required): New branch name
  - `sourceBranch` (string, optional): Source branch, defaults to default branch
  - `sourceCommitId` (string, optional): Specific commit to branch from
- Returns: Created branch details

#### 36. delete_branch
- Delete a branch
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `branch` (string, required): Branch name to delete
- Returns: Confirmation

---

### Pull Request Operations

#### 37. list_pull_requests
- List pull requests in a repository
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `status` (string, optional): `active`, `completed`, `abandoned`, `all` (default: active)
  - `creatorId` (string, optional): Filter by creator
  - `reviewerId` (string, optional): Filter by reviewer
  - `sourceBranch` (string, optional): Filter by source branch
  - `targetBranch` (string, optional): Filter by target branch
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of pull requests with summary info

#### 38. get_pull_request
- Get details for a specific pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
  - `includeCommits` (boolean, optional): Include commits, default true
  - `includeWorkItems` (boolean, optional): Include linked work items, default true
- Returns: Full pull request details

#### 39. create_pull_request
- Create a new pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `sourceBranch` (string, required): Source branch name
  - `targetBranch` (string, required): Target branch name
  - `title` (string, required): PR title
  - `description` (string, optional): PR description (supports markdown)
  - `reviewers` (string[], optional): Array of reviewer emails or IDs
  - `workItemIds` (number[], optional): Work item IDs to link
  - `isDraft` (boolean, optional): Create as draft PR, default false
  - `autoComplete` (boolean, optional): Set auto-complete, default false
  - `deleteSourceBranch` (boolean, optional): Delete source after merge, default false
- Returns: Created pull request

#### 40. update_pull_request
- Update a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
  - `title` (string, optional): New title
  - `description` (string, optional): New description
  - `status` (string, optional): `active`, `abandoned`, `completed`
  - `autoComplete` (boolean, optional): Set/unset auto-complete
  - `deleteSourceBranch` (boolean, optional): Delete source after merge
  - `isDraft` (boolean, optional): Convert to/from draft
- Returns: Updated pull request

#### 41. add_pull_request_reviewer
- Add a reviewer to a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
  - `reviewer` (string, required): Reviewer email or ID
  - `isRequired` (boolean, optional): Mark as required reviewer, default false
- Returns: Confirmation

#### 42. remove_pull_request_reviewer
- Remove a reviewer from a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
  - `reviewer` (string, required): Reviewer email or ID
- Returns: Confirmation

#### 43. add_pull_request_comment
- Add a comment to a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
  - `content` (string, required): Comment content (supports markdown)
  - `threadId` (number, optional): Reply to existing thread
  - `filePath` (string, optional): File path for file-level comment
  - `lineNumber` (number, optional): Line number for inline comment
  - `status` (string, optional): Thread status - `active`, `fixed`, `wontFix`, `closed`, `pending`
- Returns: Created comment/thread

#### 44. get_pull_request_comments
- Get all comments/threads on a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
- Returns: Array of comment threads

#### 45. complete_pull_request
- Complete (merge) a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
  - `mergeStrategy` (string, optional): `noFastForward`, `squash`, `rebase`, `rebaseMerge` (default: noFastForward)
  - `deleteSourceBranch` (boolean, optional): Delete source branch after merge
  - `commitMessage` (string, optional): Custom merge commit message
  - `bypassPolicy` (boolean, optional): Bypass branch policies (requires permission)
- Returns: Completed pull request

#### 46. get_pull_request_work_items
- Get work items linked to a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
- Returns: Array of linked work items

#### 47. link_pull_request_work_item
- Link a work item to a pull request
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `pullRequestId` (number, required): Pull request ID
  - `workItemId` (number, required): Work item ID to link
- Returns: Confirmation

---

### Pipeline Operations

#### 48. list_pipelines
- List all pipelines in a project
- Parameters:
  - `project` (string, optional)
  - `folder` (string, optional): Filter by folder path
- Returns: Array of pipelines with ID, name, folder

#### 49. get_pipeline
- Get details for a specific pipeline
- Parameters:
  - `project` (string, optional)
  - `pipelineId` (number, required): Pipeline ID
- Returns: Full pipeline details including configuration

#### 50. list_pipeline_runs
- List runs for a pipeline
- Parameters:
  - `project` (string, optional)
  - `pipelineId` (number, required): Pipeline ID
  - `branch` (string, optional): Filter by branch
  - `status` (string, optional): `inProgress`, `completed`, `cancelling`, `postponed`, `notStarted`, `all`
  - `result` (string, optional): `succeeded`, `failed`, `canceled`
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of pipeline runs

#### 51. get_pipeline_run
- Get details for a specific pipeline run
- Parameters:
  - `project` (string, optional)
  - `pipelineId` (number, required): Pipeline ID
  - `runId` (number, required): Run ID
  - `includeLogs` (boolean, optional): Include log references, default false
- Returns: Full run details with stages, jobs, steps

#### 52. run_pipeline
- Trigger a new pipeline run
- Parameters:
  - `project` (string, optional)
  - `pipelineId` (number, required): Pipeline ID
  - `branch` (string, optional): Branch to run on
  - `variables` (object, optional): Runtime variables to set
  - `parameters` (object, optional): Pipeline parameters
  - `stagesToSkip` (string[], optional): Stages to skip
- Returns: Created run details

#### 53. cancel_pipeline_run
- Cancel a running pipeline
- Parameters:
  - `project` (string, optional)
  - `pipelineId` (number, required): Pipeline ID
  - `runId` (number, required): Run ID
- Returns: Confirmation

#### 54. get_pipeline_logs
- Get logs for a pipeline run
- Parameters:
  - `project` (string, optional)
  - `pipelineId` (number, required): Pipeline ID
  - `runId` (number, required): Run ID
  - `logId` (number, optional): Specific log ID (from run details)
- Returns: Log content

---

### Build Operations (Classic Builds)

#### 55. list_build_definitions
- List classic build definitions
- Parameters:
  - `project` (string, optional)
  - `path` (string, optional): Filter by folder path
- Returns: Array of build definitions

#### 56. list_builds
- List builds
- Parameters:
  - `project` (string, optional)
  - `definitionId` (number, optional): Filter by definition
  - `branch` (string, optional): Filter by branch
  - `status` (string, optional): `inProgress`, `completed`, `cancelling`, `postponed`, `notStarted`, `all`
  - `result` (string, optional): `succeeded`, `partiallySucceeded`, `failed`, `canceled`
  - `requestedFor` (string, optional): Filter by requester
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of builds

#### 57. get_build
- Get details for a specific build
- Parameters:
  - `project` (string, optional)
  - `buildId` (number, required): Build ID
- Returns: Full build details

#### 58. queue_build
- Queue a new build
- Parameters:
  - `project` (string, optional)
  - `definitionId` (number, required): Build definition ID
  - `branch` (string, optional): Branch to build
  - `parameters` (object, optional): Build parameters
- Returns: Queued build details

#### 59. cancel_build
- Cancel a running build
- Parameters:
  - `project` (string, optional)
  - `buildId` (number, required): Build ID
- Returns: Confirmation

#### 60. get_build_logs
- Get logs for a build
- Parameters:
  - `project` (string, optional)
  - `buildId` (number, required): Build ID
  - `logId` (number, optional): Specific log ID
- Returns: Log content

---

### Release Operations

#### 61. list_release_definitions
- List release definitions
- Parameters:
  - `project` (string, optional)
  - `searchText` (string, optional): Filter by name
  - `path` (string, optional): Filter by folder path
- Returns: Array of release definitions

#### 62. get_release_definition
- Get details for a release definition
- Parameters:
  - `project` (string, optional)
  - `definitionId` (number, required): Definition ID
- Returns: Full definition with stages and environments

#### 63. list_releases
- List releases
- Parameters:
  - `project` (string, optional)
  - `definitionId` (number, optional): Filter by definition
  - `status` (string, optional): `draft`, `active`, `abandoned`
  - `environmentStatus` (string, optional): Filter by environment status
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of releases

#### 64. get_release
- Get details for a specific release
- Parameters:
  - `project` (string, optional)
  - `releaseId` (number, required): Release ID
- Returns: Full release details with environments

#### 65. create_release
- Create a new release
- Parameters:
  - `project` (string, optional)
  - `definitionId` (number, required): Release definition ID
  - `description` (string, optional): Release description
  - `artifacts` (object[], optional): Artifact versions to use
  - `isDraft` (boolean, optional): Create as draft
  - `variables` (object, optional): Release variables
- Returns: Created release

#### 66. deploy_release
- Deploy a release to an environment
- Parameters:
  - `project` (string, optional)
  - `releaseId` (number, required): Release ID
  - `environmentId` (number, required): Environment ID
  - `comment` (string, optional): Deployment comment
- Returns: Deployment details

#### 67. get_release_environment
- Get details for a release environment
- Parameters:
  - `project` (string, optional)
  - `releaseId` (number, required): Release ID
  - `environmentId` (number, required): Environment ID
- Returns: Environment details with deployment history

#### 68. approve_release
- Approve a pending release deployment
- Parameters:
  - `project` (string, optional)
  - `releaseId` (number, required): Release ID
  - `approvalId` (number, required): Approval ID
  - `status` (string, required): `approved` or `rejected`
  - `comment` (string, optional): Approval comment
- Returns: Updated approval

#### 69. get_release_logs
- Get logs for a release deployment
- Parameters:
  - `project` (string, optional)
  - `releaseId` (number, required): Release ID
  - `environmentId` (number, required): Environment ID
- Returns: Log content

---

### Wiki Operations

#### 70. list_wikis
- List all wikis in a project
- Parameters:
  - `project` (string, optional)
- Returns: Array of wikis with ID, name, type

#### 71. get_wiki
- Get details for a specific wiki
- Parameters:
  - `project` (string, optional)
  - `wikiId` (string, required): Wiki ID or name
- Returns: Wiki details including root page

#### 72. get_wiki_page
- Get a wiki page
- Parameters:
  - `project` (string, optional)
  - `wikiId` (string, required): Wiki ID or name
  - `path` (string, required): Page path
  - `version` (string, optional): Specific version/commit
  - `includeContent` (boolean, optional): Include page content, default true
- Returns: Page details with content

#### 73. create_wiki_page
- Create a new wiki page
- Parameters:
  - `project` (string, optional)
  - `wikiId` (string, required): Wiki ID or name
  - `path` (string, required): Page path
  - `content` (string, required): Page content (markdown)
  - `comment` (string, optional): Commit comment
- Returns: Created page

#### 74. update_wiki_page
- Update a wiki page
- Parameters:
  - `project` (string, optional)
  - `wikiId` (string, required): Wiki ID or name
  - `path` (string, required): Page path
  - `content` (string, required): New content (markdown)
  - `comment` (string, optional): Commit comment
  - `version` (string, required): Current ETag version (for concurrency)
- Returns: Updated page

#### 75. delete_wiki_page
- Delete a wiki page
- Parameters:
  - `project` (string, optional)
  - `wikiId` (string, required): Wiki ID or name
  - `path` (string, required): Page path
  - `comment` (string, optional): Commit comment
- Returns: Confirmation

#### 76. list_wiki_pages
- List pages in a wiki
- Parameters:
  - `project` (string, optional)
  - `wikiId` (string, required): Wiki ID or name
  - `path` (string, optional): Start path, defaults to root
  - `recursive` (boolean, optional): List recursively, default true
- Returns: Hierarchical list of pages

---

### Test Plan Operations

#### 77. list_test_plans
- List test plans in a project
- Parameters:
  - `project` (string, optional)
  - `owner` (string, optional): Filter by owner
  - `includePlanDetails` (boolean, optional): Include full details, default false
- Returns: Array of test plans

#### 78. get_test_plan
- Get details for a test plan
- Parameters:
  - `project` (string, optional)
  - `planId` (number, required): Test plan ID
- Returns: Full test plan details

#### 79. list_test_suites
- List test suites in a plan
- Parameters:
  - `project` (string, optional)
  - `planId` (number, required): Test plan ID
- Returns: Array of test suites

#### 80. get_test_suite
- Get details for a test suite
- Parameters:
  - `project` (string, optional)
  - `planId` (number, required): Test plan ID
  - `suiteId` (number, required): Test suite ID
- Returns: Full suite details

#### 81. list_test_cases
- List test cases in a suite
- Parameters:
  - `project` (string, optional)
  - `planId` (number, required): Test plan ID
  - `suiteId` (number, required): Test suite ID
- Returns: Array of test cases

#### 82. get_test_results
- Get test results for a run
- Parameters:
  - `project` (string, optional)
  - `runId` (number, required): Test run ID
- Returns: Array of test results

#### 83. list_test_runs
- List test runs
- Parameters:
  - `project` (string, optional)
  - `planId` (number, optional): Filter by plan
  - `state` (string, optional): `unspecified`, `notStarted`, `inProgress`, `completed`, `aborted`, `waiting`
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of test runs

---

### Artifact Operations

#### 84. list_feeds
- List artifact feeds
- Parameters:
  - `project` (string, optional): Project-scoped feeds, or omit for org-scoped
- Returns: Array of feeds with ID, name, description

#### 85. get_feed
- Get details for a feed
- Parameters:
  - `feedId` (string, required): Feed ID or name
  - `project` (string, optional)
- Returns: Full feed details

#### 86. list_packages
- List packages in a feed
- Parameters:
  - `feedId` (string, required): Feed ID or name
  - `project` (string, optional)
  - `protocolType` (string, optional): `npm`, `nuget`, `maven`, `pypi`, `upack`, `cargo`
  - `packageNameQuery` (string, optional): Search by name
  - `maxResults` (number, optional): Limit results, default 50
- Returns: Array of packages

#### 87. get_package
- Get details for a package
- Parameters:
  - `feedId` (string, required): Feed ID or name
  - `packageId` (string, required): Package ID or name
  - `project` (string, optional)
- Returns: Package details with versions

#### 88. get_package_versions
- Get all versions of a package
- Parameters:
  - `feedId` (string, required): Feed ID or name
  - `packageId` (string, required): Package ID or name
  - `project` (string, optional)
- Returns: Array of versions

---

### Service Connection Operations

#### 89. list_service_connections
- List service connections/endpoints
- Parameters:
  - `project` (string, optional)
  - `type` (string, optional): Filter by connection type (e.g., `azurerm`, `github`, `docker`)
- Returns: Array of service connections

#### 90. get_service_connection
- Get details for a service connection
- Parameters:
  - `project` (string, optional)
  - `connectionId` (string, required): Connection ID
- Returns: Full connection details (excluding secrets)

---

### Variable Group Operations

#### 91. list_variable_groups
- List variable groups
- Parameters:
  - `project` (string, optional)
  - `groupName` (string, optional): Filter by name
- Returns: Array of variable groups

#### 92. get_variable_group
- Get details for a variable group
- Parameters:
  - `project` (string, optional)
  - `groupId` (number, required): Variable group ID
- Returns: Full variable group with variables (secrets masked)

---

### User & Identity Operations

#### 93. search_users
- Search for users in the organization
- Parameters:
  - `query` (string, required): Search query (name or email)
  - `maxResults` (number, optional): Limit results, default 20
- Returns: Array of users with ID, display name, email

#### 94. get_user
- Get details for a user
- Parameters:
  - `userId` (string, required): User ID or email
- Returns: User profile details

#### 95. get_current_user
- Get the authenticated user's details
- Parameters: none
- Returns: Current user profile

---

### Notification Operations

#### 96. list_subscriptions
- List notification subscriptions
- Parameters:
  - `targetId` (string, optional): Filter by subscriber ID
- Returns: Array of subscriptions

---

### Dashboard & Widget Operations

#### 97. list_dashboards
- List dashboards in a project
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional)
- Returns: Array of dashboards

#### 98. get_dashboard
- Get details for a dashboard including widgets
- Parameters:
  - `project` (string, optional)
  - `team` (string, optional)
  - `dashboardId` (string, required): Dashboard ID
- Returns: Dashboard with widgets

---

### Policy Operations

#### 99. list_branch_policies
- List branch policies for a repository
- Parameters:
  - `project` (string, optional)
  - `repository` (string, required): Repository name or ID
  - `branch` (string, optional): Filter by branch
- Returns: Array of policies

#### 100. get_branch_policy
- Get details for a branch policy
- Parameters:
  - `project` (string, optional)
  - `policyId` (number, required): Policy configuration ID
- Returns: Full policy configuration

---

## Technical Requirements

- Use `azure-devops-node-api` npm package for ADO API calls
- Use `@modelcontextprotocol/sdk` for the MCP server implementation
- Transport: stdio (standard for MCP servers used with Claude)
- Include proper error handling with meaningful error messages
- Validate PAT on server startup and fail fast if invalid
- Handle pagination for large result sets
- Support both IDs and names where ADO allows

---

## Testing Requirements

**All tools must have comprehensive test coverage.** Use Jest as the testing framework.

### Test Structure
```
tests/
├── unit/
│   ├── tools/
│   │   ├── work-items/
│   │   ├── links/
│   │   ├── attachments/
│   │   ├── boards/
│   │   ├── project/
│   │   ├── git/
│   │   ├── pull-requests/
│   │   ├── pipelines/
│   │   ├── builds/
│   │   ├── releases/
│   │   ├── wiki/
│   │   ├── test-plans/
│   │   ├── artifacts/
│   │   ├── service-connections/
│   │   ├── variable-groups/
│   │   ├── users/
│   │   ├── dashboards/
│   │   └── policies/
│   └── ado-client.test.ts
├── integration/
│   └── (optional - for testing against real ADO instance)
└── mocks/
    ├── ado-responses.ts
    └── test-fixtures.ts
```

### Test Requirements for Each Tool

1. **Happy path tests**: Verify correct behavior with valid inputs
2. **Parameter validation tests**: Verify proper error handling for:
   - Missing required parameters
   - Invalid parameter types
   - Out-of-range values
3. **Error handling tests**: Verify graceful handling of:
   - API errors (404, 401, 403, 500)
   - Network failures
   - Invalid responses
4. **Edge case tests**: 
   - Empty results
   - Pagination boundaries
   - Special characters in inputs
   - Maximum field lengths

### Mocking Strategy

- Mock the `azure-devops-node-api` client for unit tests
- Create realistic mock responses based on actual ADO API responses
- Use dependency injection to allow easy mocking of the ADO client

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  }
}
```

### Coverage Requirements

- Minimum 80% code coverage overall
- 100% coverage on parameter validation logic
- 100% coverage on error handling paths

---

## Project Structure

```
azure-devops-mcp/
├── src/
│   ├── index.ts
│   ├── ado-client.ts
│   ├── tools/
│   │   ├── work-items/
│   │   ├── links/
│   │   ├── attachments/
│   │   ├── boards/
│   │   ├── project/
│   │   ├── git/
│   │   ├── pull-requests/
│   │   ├── pipelines/
│   │   ├── builds/
│   │   ├── releases/
│   │   ├── wiki/
│   │   ├── test-plans/
│   │   ├── artifacts/
│   │   ├── service-connections/
│   │   ├── variable-groups/
│   │   ├── users/
│   │   ├── notifications/
│   │   ├── dashboards/
│   │   └── policies/
│   └── types.ts
├── tests/
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## README Should Include

- How to generate an ADO Personal Access Token with required scopes:
  - Work Items: Read & Write
  - Code: Read & Write (for Git operations)
  - Build: Read & Execute
  - Release: Read, Write, & Execute
  - Test Management: Read & Write
  - Wiki: Read & Write
  - Packaging: Read
  - Project and Team: Read
  - Variable Groups: Read
  - Service Connections: Read
- Environment variable setup
- How to add the server to Claude Desktop config (`claude_desktop_config.json`)
- Example prompts demonstrating each tool category
- How to run tests
- Troubleshooting common PAT permission issues

---

## Implementation Notes

1. Start by implementing the ADO client wrapper with proper authentication
2. Implement tools in order of dependency (project → work items → git → PRs → pipelines → releases → wiki → tests → artifacts → misc)
3. Write tests alongside each tool implementation
4. Ensure all tests pass before moving to the next category
5. Run full test suite before considering implementation complete
