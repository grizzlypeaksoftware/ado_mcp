import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const getPullRequestSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
  includeCommits: z.boolean().default(true).describe("Include commits, default true"),
  includeWorkItems: z.boolean().default(true).describe("Include linked work items, default true"),
});

export const getPullRequestTool = {
  name: "get_pull_request",
  description: "Get details for a specific pull request",
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
      includeCommits: {
        type: "boolean",
        description: "Include commits, default true",
      },
      includeWorkItems: {
        type: "boolean",
        description: "Include linked work items, default true",
      },
    },
    required: ["repository", "pullRequestId"],
  },
};

export interface PullRequestDetails {
  id: number;
  title: string;
  description?: string;
  status: string;
  createdBy: string;
  creationDate: string;
  closedDate?: string;
  sourceBranch: string;
  targetBranch: string;
  isDraft: boolean;
  mergeStatus?: string;
  autoCompleteSetBy?: string;
  reviewers: Array<{
    id: string;
    displayName: string;
    vote: number;
    isRequired: boolean;
  }>;
  commits?: Array<{
    commitId: string;
    message: string;
    author: string;
  }>;
  workItems?: Array<{
    id: number;
    title: string;
    state: string;
  }>;
  url: string;
}

export async function getPullRequest(
  client: AdoClient,
  params: z.infer<typeof getPullRequestSchema>
): Promise<PullRequestDetails> {
  const validatedParams = getPullRequestSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  const pr = await gitApi.getPullRequest(
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  if (!pr) {
    throw new Error(`Pull request ${validatedParams.pullRequestId} not found`);
  }

  const result: PullRequestDetails = {
    id: pr.pullRequestId || 0,
    title: pr.title || "",
    description: pr.description,
    status: getStatusString(pr.status),
    createdBy: pr.createdBy?.displayName || "",
    creationDate: pr.creationDate?.toISOString() || "",
    closedDate: pr.closedDate?.toISOString(),
    sourceBranch: pr.sourceRefName?.replace("refs/heads/", "") || "",
    targetBranch: pr.targetRefName?.replace("refs/heads/", "") || "",
    isDraft: pr.isDraft || false,
    mergeStatus: getMergeStatusString(pr.mergeStatus),
    autoCompleteSetBy: pr.autoCompleteSetBy?.displayName,
    reviewers: (pr.reviewers || []).map((r) => ({
      id: r.id || "",
      displayName: r.displayName || "",
      vote: r.vote || 0,
      isRequired: r.isRequired || false,
    })),
    url: pr.url || "",
  };

  // Get commits if requested
  if (validatedParams.includeCommits) {
    const commits = await gitApi.getPullRequestCommits(
      validatedParams.repository,
      validatedParams.pullRequestId,
      project
    );

    if (commits) {
      result.commits = commits.map((c) => ({
        commitId: c.commitId || "",
        message: c.comment || "",
        author: c.author?.name || "",
      }));
    }
  }

  // Get work items if requested
  if (validatedParams.includeWorkItems) {
    const workItemRefs = await gitApi.getPullRequestWorkItemRefs(
      validatedParams.repository,
      validatedParams.pullRequestId,
      project
    );

    if (workItemRefs && workItemRefs.length > 0) {
      const witApi = await client.getWorkItemTrackingApi();
      const ids = workItemRefs
        .filter((ref) => ref.id)
        .map((ref) => parseInt(ref.id!, 10));

      if (ids.length > 0) {
        const workItems = await witApi.getWorkItems(ids, [
          "System.Title",
          "System.State",
        ]);

        if (workItems) {
          result.workItems = workItems
            .filter((wi) => wi && wi.fields)
            .map((wi) => ({
              id: wi.id || 0,
              title: wi.fields!["System.Title"] || "",
              state: wi.fields!["System.State"] || "",
            }));
        }
      }
    }
  }

  return result;
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

function getMergeStatusString(status?: GitInterfaces.PullRequestAsyncStatus): string | undefined {
  switch (status) {
    case GitInterfaces.PullRequestAsyncStatus.Conflicts:
      return "conflicts";
    case GitInterfaces.PullRequestAsyncStatus.Failure:
      return "failure";
    case GitInterfaces.PullRequestAsyncStatus.NotSet:
      return "notSet";
    case GitInterfaces.PullRequestAsyncStatus.Queued:
      return "queued";
    case GitInterfaces.PullRequestAsyncStatus.RejectedByPolicy:
      return "rejectedByPolicy";
    case GitInterfaces.PullRequestAsyncStatus.Succeeded:
      return "succeeded";
    default:
      return undefined;
  }
}
