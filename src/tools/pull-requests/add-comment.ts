import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export const addPullRequestCommentSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  repository: z.string().describe("Repository name or ID"),
  pullRequestId: z.number().describe("Pull request ID"),
  content: z.string().describe("Comment content (supports markdown)"),
  threadId: z.number().optional().describe("Reply to existing thread"),
  filePath: z.string().optional().describe("File path for file-level comment"),
  lineNumber: z.number().optional().describe("Line number for inline comment"),
  status: z
    .enum(["active", "fixed", "wontFix", "closed", "pending"])
    .optional()
    .describe("Thread status"),
});

export const addPullRequestCommentTool = {
  name: "add_pull_request_comment",
  description: "Add a comment or code review feedback to a pull request. Can create general comments, reply to existing threads, or add inline comments on specific files and lines. Supports markdown formatting and thread status (active/fixed/wontFix/closed/pending).",
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
      content: {
        type: "string",
        description: "Comment content (supports markdown)",
      },
      threadId: {
        type: "number",
        description: "Reply to existing thread",
      },
      filePath: {
        type: "string",
        description: "File path for file-level comment",
      },
      lineNumber: {
        type: "number",
        description: "Line number for inline comment",
      },
      status: {
        type: "string",
        enum: ["active", "fixed", "wontFix", "closed", "pending"],
        description: "Thread status",
      },
    },
    required: ["repository", "pullRequestId", "content"],
  },
};

export interface AddCommentResult {
  success: boolean;
  threadId: number;
  commentId: number;
  message: string;
}

export async function addPullRequestComment(
  client: AdoClient,
  params: z.infer<typeof addPullRequestCommentSchema>
): Promise<AddCommentResult> {
  const validatedParams = addPullRequestCommentSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const gitApi = await client.getGitApi();

  // If replying to existing thread
  if (validatedParams.threadId) {
    const comment: GitInterfaces.Comment = {
      content: validatedParams.content,
      commentType: GitInterfaces.CommentType.Text,
    };

    const createdComment = await gitApi.createComment(
      comment,
      validatedParams.repository,
      validatedParams.pullRequestId,
      validatedParams.threadId,
      project
    );

    return {
      success: true,
      threadId: validatedParams.threadId,
      commentId: createdComment.id || 0,
      message: `Successfully added comment to thread ${validatedParams.threadId}`,
    };
  }

  // Create new thread
  const thread: GitInterfaces.GitPullRequestCommentThread = {
    comments: [
      {
        content: validatedParams.content,
        commentType: GitInterfaces.CommentType.Text,
      },
    ],
    status: getThreadStatus(validatedParams.status),
  };

  // Add file context if specified
  if (validatedParams.filePath) {
    thread.threadContext = {
      filePath: validatedParams.filePath,
      rightFileStart: validatedParams.lineNumber
        ? { line: validatedParams.lineNumber, offset: 1 }
        : undefined,
      rightFileEnd: validatedParams.lineNumber
        ? { line: validatedParams.lineNumber, offset: 1 }
        : undefined,
    };
  }

  const createdThread = await gitApi.createThread(
    thread,
    validatedParams.repository,
    validatedParams.pullRequestId,
    project
  );

  return {
    success: true,
    threadId: createdThread.id || 0,
    commentId: createdThread.comments?.[0]?.id || 0,
    message: `Successfully created comment thread on pull request ${validatedParams.pullRequestId}`,
  };
}

function getThreadStatus(
  status?: string
): GitInterfaces.CommentThreadStatus | undefined {
  switch (status) {
    case "active":
      return GitInterfaces.CommentThreadStatus.Active;
    case "fixed":
      return GitInterfaces.CommentThreadStatus.Fixed;
    case "wontFix":
      return GitInterfaces.CommentThreadStatus.WontFix;
    case "closed":
      return GitInterfaces.CommentThreadStatus.Closed;
    case "pending":
      return GitInterfaces.CommentThreadStatus.Pending;
    default:
      return undefined;
  }
}
