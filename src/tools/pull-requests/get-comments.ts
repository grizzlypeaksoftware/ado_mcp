import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const getPullRequestCommentsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
});

export const getPullRequestCommentsTool = {
  name: "get_pull_request_comments",
  description: "Get all comments/threads on a pull request",
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
      pullRequestId: {
        type: "number",
        description: "Pull request ID",
      },
    },
    required: ["repository", "pullRequestId"],
  },
};

export interface CommentThread {
  id: number;
  status: string;
  filePath?: string;
  lineNumber?: number;
  comments: Array<{
    id: number;
    content: string;
    author: string;
    createdDate: string;
    isDeleted: boolean;
  }>;
}

export async function getPullRequestComments(
  client: AdoClient,
  params: z.infer<typeof getPullRequestCommentsSchema>
): Promise<CommentThread[]> {
  const validatedParams = getPullRequestCommentsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  const threads = await gitApi.getThreads(
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  if (!threads) {
    return [];
  }

  return threads.map((thread) => ({
    id: thread.id || 0,
    status: getThreadStatusString(thread.status),
    filePath: thread.threadContext?.filePath,
    lineNumber: thread.threadContext?.rightFileStart?.line,
    comments: (thread.comments || []).map((comment) => ({
      id: comment.id || 0,
      content: comment.content || "",
      author: comment.author?.displayName || "",
      createdDate: comment.publishedDate?.toISOString() || "",
      isDeleted: comment.isDeleted || false,
    })),
  }));
}

function getThreadStatusString(
  status?: GitInterfaces.CommentThreadStatus
): string {
  switch (status) {
    case GitInterfaces.CommentThreadStatus.Active:
      return "active";
    case GitInterfaces.CommentThreadStatus.Fixed:
      return "fixed";
    case GitInterfaces.CommentThreadStatus.WontFix:
      return "wontFix";
    case GitInterfaces.CommentThreadStatus.Closed:
      return "closed";
    case GitInterfaces.CommentThreadStatus.Pending:
      return "pending";
    case GitInterfaces.CommentThreadStatus.ByDesign:
      return "byDesign";
    default:
      return "unknown";
  }
}
