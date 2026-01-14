import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const addPullRequestReviewerSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
  reviewer: z.string().describe("Reviewer email or ID"),
  isRequired: z.boolean().default(false).describe("Mark as required reviewer, default false"),
});

export const addPullRequestReviewerTool = {
  name: "add_pull_request_reviewer",
  description: "Add a reviewer to a pull request by email or user ID. Can mark as required reviewer whose approval is mandatory for completion. Use this to request code review from specific team members.",
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
      reviewer: {
        type: "string",
        description: "Reviewer email or ID",
      },
      isRequired: {
        type: "boolean",
        description: "Mark as required reviewer, default false",
      },
    },
    required: ["repository", "pullRequestId", "reviewer"],
  },
};

export interface AddReviewerResult {
  success: boolean;
  reviewer: string;
  isRequired: boolean;
  message: string;
}

export async function addPullRequestReviewer(
  client: AdoClient,
  params: z.infer<typeof addPullRequestReviewerSchema>
): Promise<AddReviewerResult> {
  const validatedParams = addPullRequestReviewerSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  const reviewer: GitInterfaces.IdentityRefWithVote = {
    id: validatedParams.reviewer,
    isRequired: validatedParams.isRequired,
  };

  await gitApi.createPullRequestReviewer(
    reviewer,
    validatedParams.repository,
    validatedParams.pullRequestId,
    validatedParams.reviewer,
    project
  );

  return {
    success: true,
    reviewer: validatedParams.reviewer,
    isRequired: validatedParams.isRequired,
    message: `Successfully added reviewer ${validatedParams.reviewer} to pull request ${validatedParams.pullRequestId}`,
  };
}
