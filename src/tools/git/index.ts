import { AdoClient } from "../../ado-client.js";

// Import all git tools
import { listRepositoriesTool, listRepositories } from "./list-repositories.js";
import { getRepositoryTool, getRepository } from "./get-repository.js";
import { listBranchesTool, listBranches } from "./list-branches.js";
import { getBranchTool, getBranch } from "./get-branch.js";
import { listCommitsTool, listCommits } from "./list-commits.js";
import { getCommitTool, getCommit } from "./get-commit.js";
import { getFileContentTool, getFileContent } from "./get-file-content.js";
import { listFilesTool, listFiles } from "./list-files.js";
import { createBranchTool, createBranch } from "./create-branch.js";
import { deleteBranchTool, deleteBranch } from "./delete-branch.js";

// Export all tool definitions
export const gitTools = [
  listRepositoriesTool,
  getRepositoryTool,
  listBranchesTool,
  getBranchTool,
  listCommitsTool,
  getCommitTool,
  getFileContentTool,
  listFilesTool,
  createBranchTool,
  deleteBranchTool,
];

// Tool handler router
export async function handleGitTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_repositories":
      return listRepositories(client, args as Parameters<typeof listRepositories>[1]);
    case "get_repository":
      return getRepository(client, args as Parameters<typeof getRepository>[1]);
    case "list_branches":
      return listBranches(client, args as Parameters<typeof listBranches>[1]);
    case "get_branch":
      return getBranch(client, args as Parameters<typeof getBranch>[1]);
    case "list_commits":
      return listCommits(client, args as Parameters<typeof listCommits>[1]);
    case "get_commit":
      return getCommit(client, args as Parameters<typeof getCommit>[1]);
    case "get_file_content":
      return getFileContent(client, args as Parameters<typeof getFileContent>[1]);
    case "list_files":
      return listFiles(client, args as Parameters<typeof listFiles>[1]);
    case "create_branch":
      return createBranch(client, args as Parameters<typeof createBranch>[1]);
    case "delete_branch":
      return deleteBranch(client, args as Parameters<typeof deleteBranch>[1]);
    default:
      throw new Error(`Unknown git tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  listRepositoriesTool,
  listRepositories,
  getRepositoryTool,
  getRepository,
  listBranchesTool,
  listBranches,
  getBranchTool,
  getBranch,
  listCommitsTool,
  listCommits,
  getCommitTool,
  getCommit,
  getFileContentTool,
  getFileContent,
  listFilesTool,
  listFiles,
  createBranchTool,
  createBranch,
  deleteBranchTool,
  deleteBranch,
};
