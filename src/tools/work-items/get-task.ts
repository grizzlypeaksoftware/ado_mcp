import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { getTypedWorkItemSchema, getTypedWorkItem, TypedWorkItemDetails } from "./get-typed-work-item.js";

export const getTaskSchema = getTypedWorkItemSchema;

export const getTaskTool = {
  name: "get_task",
  description: "Get complete details for a Task work item by ID. Returns all fields including title, description, state, original/remaining/completed work hours, activity type, parent User Story, and comments. Returns an error if the work item exists but is not a Task.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Task work item ID",
      },
      includeRelations: {
        type: "boolean",
        description: "Include parent User Story and other relations, default true",
      },
      includeAttachments: {
        type: "boolean",
        description: "Include attachment info, default true",
      },
    },
    required: ["id"],
  },
};

export async function getTask(
  client: AdoClient,
  params: z.input<typeof getTaskSchema>
): Promise<TypedWorkItemDetails> {
  return getTypedWorkItem(client, params, "Task");
}
