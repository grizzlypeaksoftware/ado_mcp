import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { RepositorySummary } from "../../types.js";

export const listRepositoriesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
});

export const listRepositoriesTool = {
  name: "list_repositories",
  description: "List all Git repositories in an Azure DevOps project. Returns repository ID, name, clone URL, and default branch for each repo. Use this to discover available repositories before performing git operations like listing branches or files.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
    },
    required: [],
  },
};

export async function listRepositories(
  client: AdoClient,
  params: z.infer<typeof listRepositoriesSchema>
): Promise<RepositorySummary[]> {
  const validatedParams = listRepositoriesSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();
  const repositories = await gitApi.getRepositories(project);

  if (!repositories) {
    return [];
  }

  return repositories.map((repo) => ({
    id: repo.id || "",
    name: repo.name || "",
    url: repo.remoteUrl || repo.url || "",
    defaultBranch: repo.defaultBranch?.replace("refs/heads/", ""),
    project: {
      id: repo.project?.id || "",
      name: repo.project?.name || "",
    },
  }));
}
