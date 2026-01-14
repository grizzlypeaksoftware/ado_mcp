import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { getTypedWorkItemSchema, getTypedWorkItem, TypedWorkItemDetails } from "./get-typed-work-item.js";

export const getFeatureSchema = getTypedWorkItemSchema;

export const getFeatureTool = {
  name: "get_feature",
  description: "Get complete details for a Feature work item by ID. Returns all fields including title, description, state, value area, target date, parent Epic, child User Stories, and comments. Returns an error if the work item exists but is not a Feature.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "Feature work item ID",
      },
      includeRelations: {
        type: "boolean",
        description: "Include parent Epic, child User Stories, and other relations, default true",
      },
      includeAttachments: {
        type: "boolean",
        description: "Include attachment info, default true",
      },
    },
    required: ["id"],
  },
};

export async function getFeature(
  client: AdoClient,
  params: z.input<typeof getFeatureSchema>
): Promise<TypedWorkItemDetails> {
  return getTypedWorkItem(client, params, "Feature");
}
