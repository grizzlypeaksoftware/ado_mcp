import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { FileItem } from "../../types.js";

export const listFilesSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  path: z.string().optional().default("/").describe("Folder path, defaults to root"),
  branch: z.string().optional().describe("Branch name"),
  recursive: z.boolean().optional().default(false).describe("List recursively"),
});

export const listFilesTool = {
  name: "list_files",
  description: "List files and folders in a Git repository at a specified path. Returns file/folder names, paths, and sizes. Can list recursively to show entire directory tree. Use this to explore repository structure or find files before reading their content.",
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
      path: {
        type: "string",
        description: "Folder path, defaults to root",
      },
      branch: {
        type: "string",
        description: "Branch name",
      },
      recursive: {
        type: "boolean",
        description: "List recursively, default false",
      },
    },
    required: ["repository"],
  },
};

export async function listFiles(
  client: AdoClient,
  params: z.infer<typeof listFilesSchema>
): Promise<FileItem[]> {
  const validatedParams = listFilesSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Build version descriptor
  let versionDescriptor;
  if (validatedParams.branch) {
    versionDescriptor = {
      version: validatedParams.branch,
      versionType: 0, // Branch
    };
  }

  // Get items in the path
  const items = await gitApi.getItems(
    validatedParams.repository,
    project,
    validatedParams.path,
    validatedParams.recursive ? 1 : undefined, // Full recursion
    undefined,
    undefined,
    undefined,
    undefined,
    versionDescriptor
  );

  if (!items) {
    return [];
  }

  // Filter out the root path itself if it's in the results
  const filteredItems = items.filter(
    (item) => item.path !== validatedParams.path
  );

  return filteredItems.map((item) => ({
    path: item.path || "",
    isFolder: item.isFolder || false,
    size: item.isFolder ? undefined : (item as { size?: number }).size,
    commitId: item.commitId,
    url: item.url || "",
  }));
}
