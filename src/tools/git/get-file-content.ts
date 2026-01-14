import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getFileContentSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  path: z.string().describe("File path in repository"),
  branch: z.string().optional().describe("Branch name, defaults to default branch"),
  commitId: z.string().optional().describe("Specific commit SHA"),
});

export const getFileContentTool = {
  name: "get_file_content",
  description: "Retrieve the contents of a file from a Git repository. Can fetch from a specific branch or commit. Returns file content as text (UTF-8) or base64 for binary files. Use this to read source code, configuration files, or any file stored in the repository.",
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
        description: "File path in repository",
      },
      branch: {
        type: "string",
        description: "Branch name, defaults to default branch",
      },
      commitId: {
        type: "string",
        description: "Specific commit SHA",
      },
    },
    required: ["repository", "path"],
  },
};

interface FileContentResult {
  path: string;
  content: string;
  encoding: "text" | "base64";
  size: number;
  commitId: string;
}

export async function getFileContent(
  client: AdoClient,
  params: z.infer<typeof getFileContentSchema>
): Promise<FileContentResult> {
  const validatedParams = getFileContentSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Build version descriptor
  let versionDescriptor;
  if (validatedParams.commitId) {
    versionDescriptor = {
      version: validatedParams.commitId,
      versionType: 2, // Commit
    };
  } else if (validatedParams.branch) {
    versionDescriptor = {
      version: validatedParams.branch,
      versionType: 0, // Branch
    };
  }

  // Get the file item to check metadata
  const item = await gitApi.getItem(
    validatedParams.repository,
    validatedParams.path,
    project,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    versionDescriptor
  );

  if (!item) {
    throw new Error(`File '${validatedParams.path}' not found`);
  }

  // Get file content as stream
  const contentStream = await gitApi.getItemContent(
    validatedParams.repository,
    validatedParams.path,
    project,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    versionDescriptor
  );

  // Read stream into buffer
  const chunks: Buffer[] = [];
  for await (const chunk of contentStream) {
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);

  // Detect if content is binary
  const isBinary = buffer.some((byte) => byte === 0);

  let content: string;
  let encoding: "text" | "base64";

  if (isBinary) {
    content = buffer.toString("base64");
    encoding = "base64";
  } else {
    content = buffer.toString("utf-8");
    encoding = "text";
  }

  return {
    path: validatedParams.path,
    content,
    encoding,
    size: buffer.length,
    commitId: item.commitId || "",
  };
}
