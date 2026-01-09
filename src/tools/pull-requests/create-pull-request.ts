import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const createPullRequestSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  sourceBranch: z.string().describe("Source branch name"),
  targetBranch: z.string().describe("Target branch name"),
  title: z.string().describe("PR title"),
  description: z.string().optional().describe("PR description (supports markdown)"),
  reviewers: z.array(z.string()).optional().describe("Array of reviewer emails or IDs"),
  workItemIds: z.array(z.number()).optional().describe("Work item IDs to link"),
  isDraft: z.boolean().default(false).describe("Create as draft PR, default false"),
  autoComplete: z.boolean().default(false).describe("Set auto-complete, default false"),
  deleteSourceBranch: z.boolean().default(false).describe("Delete source after merge, default false"),
});

export const createPullRequestTool = {
  name: "create_pull_request",
  description: "Create a new pull request",
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
      sourceBranch: {
        type: "string",
        description: "Source branch name",
      },
      targetBranch: {
        type: "string",
        description: "Target branch name",
      },
      title: {
        type: "string",
        description: "PR title",
      },
      description: {
        type: "string",
        description: "PR description (supports markdown)",
      },
      reviewers: {
        type: "array",
        items: { type: "string" },
        description: "Array of reviewer emails or IDs",
      },
      workItemIds: {
        type: "array",
        items: { type: "number" },
        description: "Work item IDs to link",
      },
      isDraft: {
        type: "boolean",
        description: "Create as draft PR, default false",
      },
      autoComplete: {
        type: "boolean",
        description: "Set auto-complete, default false",
      },
      deleteSourceBranch: {
        type: "boolean",
        description: "Delete source after merge, default false",
      },
    },
    required: ["repository", "sourceBranch", "targetBranch", "title"],
  },
};

export interface CreatePullRequestResult {
  id: number;
  title: string;
  status: string;
  sourceBranch: string;
  targetBranch: string;
  url: string;
}

export async function createPullRequest(
  client: AdoClient,
  params: z.infer<typeof createPullRequestSchema>
): Promise<CreatePullRequestResult> {
  const validatedParams = createPullRequestSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Build the PR object
  const pullRequest: GitInterfaces.GitPullRequest = {
    sourceRefName: `refs/heads/${validatedParams.sourceBranch}`,
    targetRefName: `refs/heads/${validatedParams.targetBranch}`,
    title: validatedParams.title,
    description: validatedParams.description,
    isDraft: validatedParams.isDraft,
  };

  // Add reviewers if specified
  if (validatedParams.reviewers && validatedParams.reviewers.length > 0) {
    pullRequest.reviewers = validatedParams.reviewers.map((reviewer) => ({
      id: reviewer,
    }));
  }

  // Add work item refs if specified
  if (validatedParams.workItemIds && validatedParams.workItemIds.length > 0) {
    pullRequest.workItemRefs = validatedParams.workItemIds.map((id) => ({
      id: String(id),
    }));
  }

  // Create the PR
  const createdPr = await gitApi.createPullRequest(
    pullRequest,
    validatedParams.repository,
    project
  );

  if (!createdPr) {
    throw new Error("Failed to create pull request");
  }

  // Set auto-complete if requested
  if (validatedParams.autoComplete && createdPr.pullRequestId) {
    const connectionData = await client.getConnectionData();
    const currentUserId = connectionData.authenticatedUser?.id;

    if (currentUserId) {
      const updatePr: GitInterfaces.GitPullRequest = {
        autoCompleteSetBy: {
          id: currentUserId,
        },
        completionOptions: {
          deleteSourceBranch: validatedParams.deleteSourceBranch,
        },
      };

      await gitApi.updatePullRequest(
        updatePr,
        validatedParams.repository,
        createdPr.pullRequestId,
        project
      );
    }
  }

  return {
    id: createdPr.pullRequestId || 0,
    title: createdPr.title || "",
    status: "active",
    sourceBranch: validatedParams.sourceBranch,
    targetBranch: validatedParams.targetBranch,
    url: createdPr.url || "",
  };
}
