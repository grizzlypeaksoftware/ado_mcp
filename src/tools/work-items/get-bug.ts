import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { getTypedWorkItemSchema, getTypedWorkItem, TypedWorkItemDetails } from "./get-typed-work-item.js";

export const getBugSchema = getTypedWorkItemSchema;

export const getBugTool = {
  name: "get_bug",
  description: "Get complete details for a Bug work item by ID. Returns all fields including title, repro steps, system info, severity, priority, found-in/integrated-in builds, related work items, and comments. Returns an error if the work item exists but is not a Bug.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Bug work item ID",
      },
      includeRelations: {
        type: "boolean",
        description: "Include related work items and other relations, default true",
      },
      includeAttachments: {
        type: "boolean",
        description: "Include attachment info, default true",
      },
    },
    required: ["id"],
  },
};

export async function getBug(
  client: AdoClient,
  params: z.input<typeof getBugSchema>
): Promise<TypedWorkItemDetails> {
  return getTypedWorkItem(client, params, "Bug");
}
