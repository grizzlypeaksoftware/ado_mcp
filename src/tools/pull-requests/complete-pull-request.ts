import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const completePullRequestSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
  mergeStrategy: z
    .enum(["noFastForward", "squash", "rebase", "rebaseMerge"])
    .default("noFastForward")
    .describe("Merge strategy"),
  deleteSourceBranch: z.boolean().optional().describe("Delete source branch after merge"),
  commitMessage: z.string().optional().describe("Custom merge commit message"),
  bypassPolicy: z.boolean().default(false).describe("Bypass branch policies (requires permission)"),
});

export const completePullRequestTool = {
  name: "complete_pull_request",
  description: "Complete (merge) a pull request",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      repository: {
        type: "string",
        description: "Repository name or ID",
      },
      pullRequestId: {
        type: "number",
        description: "Pull request ID",
      },
      mergeStrategy: {
        type: "string",
        enum: ["noFastForward", "squash", "rebase", "rebaseMerge"],
        description: "Merge strategy, default 'noFastForward'",
      },
      deleteSourceBranch: {
        type: "boolean",
        description: "Delete source branch after merge",
      },
      commitMessage: {
        type: "string",
        description: "Custom merge commit message",
      },
      bypassPolicy: {
        type: "boolean",
        description: "Bypass branch policies (requires permission)",
      },
    },
    required: ["repository", "pullRequestId"],
  },
};

export interface CompletePullRequestResult {
  id: number;
  status: string;
  mergeCommitId?: string;
  message: string;
}

export async function completePullRequest(
  client: AdoClient,
  params: z.infer<typeof completePullRequestSchema>
): Promise<CompletePullRequestResult> {
  const validatedParams = completePullRequestSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Get current PR to get the last merge source commit
  const currentPr = await gitApi.getPullRequest(
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  if (!currentPr) {
    throw new Error(`Pull request ${validatedParams.pullRequestId} not found`);
  }

  // Map merge strategy
  let mergeStrategy: GitInterfaces.GitPullRequestMergeStrategy;
  switch (validatedParams.mergeStrategy) {
    case "squash":
      mergeStrategy = GitInterfaces.GitPullRequestMergeStrategy.Squash;
      break;
    case "rebase":
      mergeStrategy = GitInterfaces.GitPullRequestMergeStrategy.Rebase;
      break;
    case "rebaseMerge":
      mergeStrategy = GitInterfaces.GitPullRequestMergeStrategy.RebaseMerge;
      break;
    default:
      mergeStrategy = GitInterfaces.GitPullRequestMergeStrategy.NoFastForward;
  }

  const updatePr: GitInterfaces.GitPullRequest = {
    status: GitInterfaces.PullRequestStatus.Completed,
    lastMergeSourceCommit: currentPr.lastMergeSourceCommit,
    completionOptions: {
      mergeStrategy: mergeStrategy,
      deleteSourceBranch: validatedParams.deleteSourceBranch,
      mergeCommitMessage: validatedParams.commitMessage,
      bypassPolicy: validatedParams.bypassPolicy,
    },
  };

  const completedPr = await gitApi.updatePullRequest(
    updatePr,
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  if (!completedPr) {
    throw new Error(`Failed to complete pull request ${validatedParams.pullRequestId}`);
  }

  return {
    id: completedPr.pullRequestId || 0,
    status: "completed",
    mergeCommitId: completedPr.lastMergeCommit?.commitId,
    message: `Successfully completed pull request ${validatedParams.pullRequestId}`,
  };
}
