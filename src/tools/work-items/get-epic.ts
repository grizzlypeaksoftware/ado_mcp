import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { getTypedWorkItemSchema, getTypedWorkItem, TypedWorkItemDetails } from "./get-typed-work-item.js";

export const getEpicSchema = getTypedWorkItemSchema;

export const getEpicTool = {
  name: "get_epic",
  description: "Get complete details for an Epic work item by ID. Returns all fields including title, description, state, value area, start/target dates, linked Features, and comments. Returns an error if the work item exists but is not an Epic.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Epic work item ID",
      },
      includeRelations: {
        type: "boolean",
        description: "Include linked Features and other relations, default true",
      },
      includeAttachments: {
        type: "boolean",
        description: "Include attachment info, default true",
      },
    },
    required: ["id"],
  },
};

export async function getEpic(
  client: AdoClient,
  params: z.input<typeof getEpicSchema>
): Promise<TypedWorkItemDetails> {
  return getTypedWorkItem(client, params, "Epic");
}
