import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const listPullRequestsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  status: z
    .enum(["active", "completed", "abandoned", "all"])
    .default("active")
    .describe("Filter by status"),
  creatorId: z.string().optional().describe("Filter by creator"),
  reviewerId: z.string().optional().describe("Filter by reviewer"),
  sourceBranch: z.string().optional().describe("Filter by source branch"),
  targetBranch: z.string().optional().describe("Filter by target branch"),
  maxResults: z.number().default(50).describe("Limit results, default 50"),
});

export const listPullRequestsTool = {
  name: "list_pull_requests",
  description: "List pull requests in a repository",
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
      status: {
        type: "string",
        enum: ["active", "completed", "abandoned", "all"],
        description: "Filter by status, default 'active'",
      },
      creatorId: {
        type: "string",
        description: "Filter by creator",
      },
      reviewerId: {
        type: "string",
        description: "Filter by reviewer",
      },
      sourceBranch: {
        type: "string",
        description: "Filter by source branch",
      },
      targetBranch: {
        type: "string",
        description: "Filter by target branch",
      },
      maxResults: {
        type: "number",
        description: "Limit results, default 50",
      },
    },
    required: ["repository"],
  },
};

export interface PullRequestSummary {
  id: number;
  title: string;
  status: string;
  createdBy: string;
  creationDate: string;
  sourceBranch: string;
  targetBranch: string;
  isDraft: boolean;
  url: string;
}

export async function listPullRequests(
  client: AdoClient,
  params: z.infer<typeof listPullRequestsSchema>
): Promise<PullRequestSummary[]> {
  const validatedParams = listPullRequestsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Build search criteria
  const searchCriteria: GitInterfaces.GitPullRequestSearchCriteria = {
    repositoryId: validatedParams.repository,
  };

  // Map status
  switch (validatedParams.status) {
    case "active":
      searchCriteria.status = GitInterfaces.PullRequestStatus.Active;
      break;
    case "completed":
      searchCriteria.status = GitInterfaces.PullRequestStatus.Completed;
      break;
    case "abandoned":
      searchCriteria.status = GitInterfaces.PullRequestStatus.Abandoned;
      break;
    case "all":
      searchCriteria.status = GitInterfaces.PullRequestStatus.All;
      break;
  }

  if (validatedParams.creatorId) {
    searchCriteria.creatorId = validatedParams.creatorId;
  }
  if (validatedParams.reviewerId) {
    searchCriteria.reviewerId = validatedParams.reviewerId;
  }
  if (validatedParams.sourceBranch) {
    searchCriteria.sourceRefName = `refs/heads/${validatedParams.sourceBranch}`;
  }
  if (validatedParams.targetBranch) {
    searchCriteria.targetRefName = `refs/heads/${validatedParams.targetBranch}`;
  }

  const pullRequests = await gitApi.getPullRequests(
    validatedParams.repository,
    searchCriteria,
    project,
    undefined,
    undefined,
    validatedParams.maxResults
  );

  if (!pullRequests) {
    return [];
  }

  return pullRequests.map((pr) => ({
    id: pr.pullRequestId || 0,
    title: pr.title || "",
    status: getStatusString(pr.status),
    createdBy: pr.createdBy?.displayName || "",
    creationDate: pr.creationDate?.toISOString() || "",
    sourceBranch: pr.sourceRefName?.replace("refs/heads/", "") || "",
    targetBranch: pr.targetRefName?.replace("refs/heads/", "") || "",
    isDraft: pr.isDraft || false,
    url: pr.url || "",
  }));
}

function getStatusString(status?: GitInterfaces.PullRequestStatus): string {
  switch (status) {
    case GitInterfaces.PullRequestStatus.Active:
      return "active";
    case GitInterfaces.PullRequestStatus.Completed:
      return "completed";
    case GitInterfaces.PullRequestStatus.Abandoned:
      return "abandoned";
    default:
      return "unknown";
  }
}
