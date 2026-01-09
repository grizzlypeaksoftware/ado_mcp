import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const removePullRequestReviewerSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
  reviewer: z.string().describe("Reviewer email or ID"),
});

export const removePullRequestReviewerTool = {
  name: "remove_pull_request_reviewer",
  description: "Remove a reviewer from a pull request",
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
    },
    required: ["repository", "pullRequestId", "reviewer"],
  },
};

export interface RemoveReviewerResult {
  success: boolean;
  message: string;
}

export async function removePullRequestReviewer(
  client: AdoClient,
  params: z.infer<typeof removePullRequestReviewerSchema>
): Promise<RemoveReviewerResult> {
  const validatedParams = removePullRequestReviewerSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  await gitApi.deletePullRequestReviewer(
    validatedParams.repository,
    validatedParams.pullRequestId,
    validatedParams.reviewer,
    project
  );

  return {
    success: true,
    message: `Successfully removed reviewer ${validatedParams.reviewer} from pull request ${validatedParams.pullRequestId}`,
  };
}
