import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getBranchSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  branch: z.string().describe("Branch name"),
});

export const getBranchTool = {
  name: "get_branch",
  description: "Get details for a specific branch",
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
        description: "Branch name",
      },
    },
    required: ["repository", "branch"],
  },
};

interface BranchDetails {
  name: string;
  objectId: string;
  creator?: string;
  aheadCount?: number;
  behindCount?: number;
  latestCommit: {
    commitId: string;
    message: string;
    author: string;
    date: string;
  };
}

export async function getBranch(
  client: AdoClient,
  params: z.infer<typeof getBranchSchema>
): Promise<BranchDetails> {
  const validatedParams = getBranchSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Get the branch ref
  const refName = `heads/${validatedParams.branch}`;
  const refs = await gitApi.getRefs(
    validatedParams.repository,
    project,
    refName
  );

  const branchRef = refs?.find(
    (r) => r.name === `refs/heads/${validatedParams.branch}`
  );

  if (!branchRef) {
    throw new Error(`Branch '${validatedParams.branch}' not found`);
  }

  // Get branch stats for ahead/behind
  const branchStats = await gitApi.getBranches(validatedParams.repository, project);
  const stats = branchStats?.find(
    (s) => s.name === `refs/heads/${validatedParams.branch}`
  );

  // Get the latest commit
  const commits = await gitApi.getCommits(
    validatedParams.repository,
    {
      itemVersion: {
        version: validatedParams.branch,
        versionType: 0, // Branch
      },
      $top: 1,
    },
    project
  );

  const latestCommit = commits?.[0];

  return {
    name: validatedParams.branch,
    objectId: branchRef.objectId || "",
    creator: branchRef.creator?.displayName,
    aheadCount: stats?.aheadCount,
    behindCount: stats?.behindCount,
    latestCommit: {
      commitId: latestCommit?.commitId || branchRef.objectId || "",
      message: latestCommit?.comment || "",
      author: latestCommit?.author?.name || "",
      date: latestCommit?.author?.date?.toISOString() || "",
    },
  };
}
