import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const addWorkItemCommentSchema = z.object({
  id: z.number().describe("Work item ID"),
  text: z.string().describe("Comment text (supports HTML)"),
});

export const addWorkItemCommentTool = {
  name: "add_work_item_comment",
  description: "Add a comment to a work item",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Work item ID",
      },
      text: {
        type: "string",
        description: "Comment text (supports HTML)",
      },
    },
    required: ["id", "text"],
  },
};

interface CommentResult {
  id: number;
  workItemId: number;
  text: string;
  createdBy: string;
  createdDate: string;
}

export async function addWorkItemComment(
  client: AdoClient,
  params: z.infer<typeof addWorkItemCommentSchema>
): Promise<CommentResult> {
  const validatedParams = addWorkItemCommentSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Get the project from the work item to use for the comment API
  const workItem = await witApi.getWorkItem(validatedParams.id);
  if (!workItem) {
    throw new Error(`Work item ${validatedParams.id} not found`);
  }

  const project = workItem.fields?.["System.TeamProject"] as string;

  const comment = await witApi.addComment(
    { text: validatedParams.text },
    project,
    validatedParams.id
  );

  if (!comment) {
    throw new Error(`Failed to add comment to work item ${validatedParams.id}`);
  }

  return {
    id: comment.id || 0,
    workItemId: validatedParams.id,
    text: comment.text || validatedParams.text,
    createdBy: comment.createdBy?.displayName || "",
    createdDate: comment.createdDate?.toISOString() || new Date().toISOString(),
  };
}
