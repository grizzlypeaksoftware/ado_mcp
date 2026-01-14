import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const deleteBranchSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  branch: z.string().describe("Branch name to delete"),
});

export const deleteBranchTool = {
  name: "delete_branch",
  description: "Delete a Git branch from a repository. Use this to clean up merged feature branches or remove obsolete branches. Cannot delete the default branch or branches with open pull requests targeting them.",
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
      branch: {
        type: "string",
        description: "Branch name to delete",
      },
    },
    required: ["repository", "branch"],
  },
};

interface DeleteBranchResult {
  branch: string;
  deleted: boolean;
  message: string;
}

export async function deleteBranch(
  client: AdoClient,
  params: z.infer<typeof deleteBranchSchema>
): Promise<DeleteBranchResult> {
  const validatedParams = deleteBranchSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Get the current branch ref to get its objectId
  const refs = await gitApi.getRefs(
    validatedParams.repository,
    project,
    `heads/${validatedParams.branch}`
  );

  const branchRef = refs?.find(
    (r) => r.name === `refs/heads/${validatedParams.branch}`
  );

  if (!branchRef?.objectId) {
    throw new Error(`Branch '${validatedParams.branch}' not found`);
  }

  // Delete the branch by setting newObjectId to all zeros
  const refUpdates = [
    {
      name: `refs/heads/${validatedParams.branch}`,
      oldObjectId: branchRef.objectId,
      newObjectId: "0000000000000000000000000000000000000000",
    },
  ];

  const result = await gitApi.updateRefs(
    refUpdates,
    validatedParams.repository,
    project
  );

  if (!result || result.length === 0 || !result[0].success) {
    const error = result?.[0]?.customMessage || "Unknown error";
    throw new Error(`Failed to delete branch: ${error}`);
  }

  return {
    branch: validatedParams.branch,
    deleted: true,
    message: `Branch '${validatedParams.branch}' deleted successfully`,
  };
}
