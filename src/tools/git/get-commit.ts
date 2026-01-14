import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { CommitDetails, FileChange } from "../../types.js";
import { VersionControlChangeType } from "azure-devops-node-api/interfaces/GitInterfaces.js";

export const getCommitSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  commitId: z.string().describe("Commit SHA"),
  includeChanges: z.boolean().optional().default(true).describe("Include file changes"),
});

export const getCommitTool = {
  name: "get_commit",
  description: "Get detailed information about a specific commit by SHA. Returns commit message, author/committer info, and optionally the list of files changed (added, edited, deleted). Use this to inspect what changes were made in a particular commit.",
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
      commitId: {
        type: "string",
        description: "Commit SHA",
      },
      includeChanges: {
        type: "boolean",
        description: "Include file changes, default true",
      },
    },
    required: ["repository", "commitId"],
  },
};

function getChangeTypeName(changeType: VersionControlChangeType | undefined): string {
  if (changeType === undefined) return "unknown";

  switch (changeType) {
    case VersionControlChangeType.Add:
      return "add";
    case VersionControlChangeType.Edit:
      return "edit";
    case VersionControlChangeType.Delete:
      return "delete";
    case VersionControlChangeType.Rename:
      return "rename";
    default:
      return "unknown";
  }
}

export async function getCommit(
  client: AdoClient,
  params: z.infer<typeof getCommitSchema>
): Promise<CommitDetails> {
  const validatedParams = getCommitSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Get commit details
  const commit = await gitApi.getCommit(
    validatedParams.commitId,
    validatedParams.repository,
    project
  );

  if (!commit) {
    throw new Error(`Commit '${validatedParams.commitId}' not found`);
  }

  let changes: FileChange[] | undefined;
  let changeCounts: { add: number; edit: number; delete: number } | undefined;

  if (validatedParams.includeChanges) {
    // Get commit changes
    const commitChanges = await gitApi.getChanges(
      validatedParams.commitId,
      validatedParams.repository,
      project
    );

    if (commitChanges?.changes) {
      changes = commitChanges.changes.map((change) => ({
        path: change.item?.path || "",
        changeType: getChangeTypeName(change.changeType),
      }));
    }

    // Count changes by type
    if (changes) {
      changeCounts = {
        add: changes.filter((c) => c.changeType === "add").length,
        edit: changes.filter((c) => c.changeType === "edit").length,
        delete: changes.filter((c) => c.changeType === "delete").length,
      };
    }
  }

  return {
    commitId: commit.commitId || "",
    message: commit.comment || "",
    author: {
      name: commit.author?.name || "",
      email: commit.author?.email || "",
      date: commit.author?.date?.toISOString() || "",
    },
    committer: {
      name: commit.committer?.name || "",
      email: commit.committer?.email || "",
      date: commit.committer?.date?.toISOString() || "",
    },
    url: commit.url || "",
    changeCounts,
    changes,
  };
}
