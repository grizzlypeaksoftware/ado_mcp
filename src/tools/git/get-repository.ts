import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { RepositorySummary } from "../../types.js";

export const getRepositorySchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
});

export const getRepositoryTool = {
  name: "get_repository",
  description: "Get detailed information about a specific Git repository by name or ID. Returns repository metadata including clone URLs (HTTPS and SSH), default branch, size, and web URL. Use this to get repository details needed for cloning or linking.",
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
    },
    required: ["repository"],
  },
};

interface RepositoryDetails extends RepositorySummary {
  size: number;
  sshUrl?: string;
  webUrl: string;
}

export async function getRepository(
  client: AdoClient,
  params: z.infer<typeof getRepositorySchema>
): Promise<RepositoryDetails> {
  const validatedParams = getRepositorySchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();
  const repo = await gitApi.getRepository(validatedParams.repository, project);

  if (!repo) {
    throw new Error(`Repository '${validatedParams.repository}' not found`);
  }

  return {
    id: repo.id || "",
    name: repo.name || "",
    url: repo.remoteUrl || repo.url || "",
    defaultBranch: repo.defaultBranch?.replace("refs/heads/", ""),
    project: {
      id: repo.project?.id || "",
      name: repo.project?.name || "",
    },
    size: repo.size || 0,
    sshUrl: repo.sshUrl,
    webUrl: repo.webUrl || "",
  };
}
