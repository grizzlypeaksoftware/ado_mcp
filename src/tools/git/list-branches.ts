import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { BranchInfo } from "../../types.js";

export const listBranchesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  filter: z.string().optional().describe("Filter branches by name prefix"),
});

export const listBranchesTool = {
  name: "list_branches",
  description: "List branches in a repository",
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
      filter: {
        type: "string",
        description: "Filter branches by name prefix",
      },
    },
    required: ["repository"],
  },
};

export async function listBranches(
  client: AdoClient,
  params: z.infer<typeof listBranchesSchema>
): Promise<BranchInfo[]> {
  const validatedParams = listBranchesSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Get refs (branches)
  const refs = await gitApi.getRefs(
    validatedParams.repository,
    project,
    validatedParams.filter ? `heads/${validatedParams.filter}` : "heads/"
  );

  if (!refs) {
    return [];
  }

  // Get branch stats for ahead/behind counts
  const branchStats = await gitApi.getBranches(validatedParams.repository, project);
  const statsMap = new Map(
    branchStats?.map((stat) => [stat.name, stat]) || []
  );

  return refs.map((ref) => {
    const branchName = ref.name?.replace("refs/heads/", "") || "";
    const stats = statsMap.get(`refs/heads/${branchName}`);

    return {
      name: branchName,
      objectId: ref.objectId || "",
      creator: ref.creator?.displayName,
      aheadCount: stats?.aheadCount,
      behindCount: stats?.behindCount,
    };
  });
}
