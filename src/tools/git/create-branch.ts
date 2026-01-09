import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { BranchInfo } from "../../types.js";

export const createBranchSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  name: z.string().describe("New branch name"),
  sourceBranch: z.string().optional().describe("Source branch, defaults to default branch"),
  sourceCommitId: z.string().optional().describe("Specific commit to branch from"),
});

export const createBranchTool = {
  name: "create_branch",
  description: "Create a new branch",
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
      name: {
        type: "string",
        description: "New branch name",
      },
      sourceBranch: {
        type: "string",
        description: "Source branch, defaults to default branch",
      },
      sourceCommitId: {
        type: "string",
        description: "Specific commit to branch from",
      },
    },
    required: ["repository", "name"],
  },
};

export async function createBranch(
  client: AdoClient,
  params: z.infer<typeof createBranchSchema>
): Promise<BranchInfo> {
  const validatedParams = createBranchSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Get the source commit ID
  let sourceObjectId: string;

  if (validatedParams.sourceCommitId) {
    sourceObjectId = validatedParams.sourceCommitId;
  } else {
    // Get the source branch (or default branch)
    const sourceBranchName = validatedParams.sourceBranch || "main";
    const refs = await gitApi.getRefs(
      validatedParams.repository,
      project,
      `heads/${sourceBranchName}`
    );

    const sourceRef = refs?.find(
      (r) => r.name === `refs/heads/${sourceBranchName}`
    );

    if (!sourceRef?.objectId) {
      // Try 'master' as fallback
      const masterRefs = await gitApi.getRefs(
        validatedParams.repository,
        project,
        "heads/master"
      );
      const masterRef = masterRefs?.find(
        (r) => r.name === "refs/heads/master"
      );

      if (!masterRef?.objectId) {
        throw new Error(
          `Source branch '${sourceBranchName}' not found. Please specify sourceBranch or sourceCommitId.`
        );
      }
      sourceObjectId = masterRef.objectId;
    } else {
      sourceObjectId = sourceRef.objectId;
    }
  }

  // Create the branch by updating refs
  const refUpdates = [
    {
      name: `refs/heads/${validatedParams.name}`,
      oldObjectId: "0000000000000000000000000000000000000000",
      newObjectId: sourceObjectId,
    },
  ];

  const result = await gitApi.updateRefs(
    refUpdates,
    validatedParams.repository,
    project
  );

  if (!result || result.length === 0 || !result[0].success) {
    const error = result?.[0]?.customMessage || "Unknown error";
    throw new Error(`Failed to create branch: ${error}`);
  }

  return {
    name: validatedParams.name,
    objectId: sourceObjectId,
  };
}
