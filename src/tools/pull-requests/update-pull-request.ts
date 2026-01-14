import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const updatePullRequestSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
  title: z.string().optional().describe("New title"),
  description: z.string().optional().describe("New description"),
  status: z.enum(["active", "abandoned", "completed"]).optional().describe("New status"),
  autoComplete: z.boolean().optional().describe("Set/unset auto-complete"),
  deleteSourceBranch: z.boolean().optional().describe("Delete source after merge"),
  isDraft: z.boolean().optional().describe("Convert to/from draft"),
});

export const updatePullRequestTool = {
  name: "update_pull_request",
  description: "Update an existing pull request's properties. Can change title, description, status (active/abandoned), draft status, auto-complete settings, and merge options. Use this to modify PR details, abandon a PR, or toggle draft mode.",
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
      title: {
        type: "string",
        description: "New title",
      },
      description: {
        type: "string",
        description: "New description",
      },
      status: {
        type: "string",
        enum: ["active", "abandoned", "completed"],
        description: "New status",
      },
      autoComplete: {
        type: "boolean",
        description: "Set/unset auto-complete",
      },
      deleteSourceBranch: {
        type: "boolean",
        description: "Delete source after merge",
      },
      isDraft: {
        type: "boolean",
        description: "Convert to/from draft",
      },
    },
    required: ["repository", "pullRequestId"],
  },
};

export interface UpdatePullRequestResult {
  id: number;
  title: string;
  status: string;
  isDraft: boolean;
  message: string;
}

export async function updatePullRequest(
  client: AdoClient,
  params: z.infer<typeof updatePullRequestSchema>
): Promise<UpdatePullRequestResult> {
  const validatedParams = updatePullRequestSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  const updatePr: GitInterfaces.GitPullRequest = {};

  if (validatedParams.title) {
    updatePr.title = validatedParams.title;
  }

  if (validatedParams.description !== undefined) {
    updatePr.description = validatedParams.description;
  }

  if (validatedParams.status) {
    switch (validatedParams.status) {
      case "active":
        updatePr.status = GitInterfaces.PullRequestStatus.Active;
        break;
      case "abandoned":
        updatePr.status = GitInterfaces.PullRequestStatus.Abandoned;
        break;
      case "completed":
        updatePr.status = GitInterfaces.PullRequestStatus.Completed;
        break;
    }
  }

  if (validatedParams.isDraft !== undefined) {
    updatePr.isDraft = validatedParams.isDraft;
  }

  if (validatedParams.autoComplete !== undefined) {
    if (validatedParams.autoComplete) {
      const connectionData = await client.getConnectionData();
      const currentUserId = connectionData.authenticatedUser?.id;
      if (currentUserId) {
        updatePr.autoCompleteSetBy = { id: currentUserId };
      }
    } else {
      updatePr.autoCompleteSetBy = { id: "" }; // Unset auto-complete
    }
  }

  if (validatedParams.deleteSourceBranch !== undefined) {
    updatePr.completionOptions = {
      deleteSourceBranch: validatedParams.deleteSourceBranch,
    };
  }

  const updatedPr = await gitApi.updatePullRequest(
    updatePr,
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  if (!updatedPr) {
    throw new Error(`Failed to update pull request ${validatedParams.pullRequestId}`);
  }

  return {
    id: updatedPr.pullRequestId || 0,
    title: updatedPr.title || "",
    status: getStatusString(updatedPr.status),
    isDraft: updatedPr.isDraft || false,
    message: `Successfully updated pull request ${validatedParams.pullRequestId}`,
  };
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
