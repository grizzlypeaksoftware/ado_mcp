import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const linkPullRequestWorkItemSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
  workItemId: z.number().describe("Work item ID to link"),
});

export const linkPullRequestWorkItemTool = {
  name: "link_pull_request_work_item",
  description: "Link a work item to a pull request",
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
      workItemId: {
        type: "number",
        description: "Work item ID to link",
      },
    },
    required: ["repository", "pullRequestId", "workItemId"],
  },
};

export interface LinkWorkItemResult {
  success: boolean;
  pullRequestId: number;
  workItemId: number;
  message: string;
}

export async function linkPullRequestWorkItem(
  client: AdoClient,
  params: z.infer<typeof linkPullRequestWorkItemSchema>
): Promise<LinkWorkItemResult> {
  const validatedParams = linkPullRequestWorkItemSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  // Get the PR to construct the artifact link
  const gitApi = await client.getGitApi();
  const pr = await gitApi.getPullRequest(
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  if (!pr) {
    throw new Error(`Pull request ${validatedParams.pullRequestId} not found`);
  }

  // Link the work item to the PR using the work item tracking API
  const witApi = await client.getWorkItemTrackingApi();
  const orgUrl = client.getOrgUrl();

  // Build the artifact link URL
  const artifactUrl = `vstfs:///Git/PullRequestId/${pr.repository?.project?.id}%2F${pr.repository?.id}%2F${validatedParams.pullRequestId}`;

  const patchDocument = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "ArtifactLink",
        url: artifactUrl,
        attributes: {
          name: "Pull Request",
        },
      },
    },
  ];

  await witApi.updateWorkItem(
    undefined, // customHeaders
    patchDocument,
    validatedParams.workItemId,
    project
  );

  return {
    success: true,
    pullRequestId: validatedParams.pullRequestId,
    workItemId: validatedParams.workItemId,
    message: `Successfully linked work item ${validatedParams.workItemId} to pull request ${validatedParams.pullRequestId}`,
  };
}
