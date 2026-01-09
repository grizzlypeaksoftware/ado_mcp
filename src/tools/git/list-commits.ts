import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { CommitSummary } from "../../types.js";

export const listCommitsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  branch: z.string().optional().describe("Branch name, defaults to default branch"),
  author: z.string().optional().describe("Filter by author email"),
  fromDate: z.string().optional().describe("Start date (ISO format)"),
  toDate: z.string().optional().describe("End date (ISO format)"),
  maxResults: z.number().optional().default(50).describe("Limit results"),
});

export const listCommitsTool = {
  name: "list_commits",
  description: "List commits in a repository",
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
        description: "Branch name, defaults to default branch",
      },
      author: {
        type: "string",
        description: "Filter by author email",
      },
      fromDate: {
        type: "string",
        description: "Start date (ISO format)",
      },
      toDate: {
        type: "string",
        description: "End date (ISO format)",
      },
      maxResults: {
        type: "number",
        description: "Limit results, default 50",
      },
    },
    required: ["repository"],
  },
};

export async function listCommits(
  client: AdoClient,
  params: z.infer<typeof listCommitsSchema>
): Promise<CommitSummary[]> {
  const validatedParams = listCommitsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // Build search criteria
  const searchCriteria: {
    itemVersion?: { version: string; versionType: number };
    author?: string;
    fromDate?: string;
    toDate?: string;
    $top?: number;
  } = {
    $top: validatedParams.maxResults,
  };

  if (validatedParams.branch) {
    searchCriteria.itemVersion = {
      version: validatedParams.branch,
      versionType: 0, // Branch
    };
  }

  if (validatedParams.author) {
    searchCriteria.author = validatedParams.author;
  }

  if (validatedParams.fromDate) {
    searchCriteria.fromDate = validatedParams.fromDate;
  }

  if (validatedParams.toDate) {
    searchCriteria.toDate = validatedParams.toDate;
  }

  const commits = await gitApi.getCommits(
    validatedParams.repository,
    searchCriteria,
    project
  );

  if (!commits) {
    return [];
  }

  return commits.map((commit) => ({
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
  }));
}
