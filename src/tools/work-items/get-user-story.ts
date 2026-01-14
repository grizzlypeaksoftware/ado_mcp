import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { getTypedWorkItemSchema, getTypedWorkItem, TypedWorkItemDetails } from "./get-typed-work-item.js";

export const getUserStorySchema = getTypedWorkItemSchema;

export const getUserStoryTool = {
  name: "get_user_story",
  description: "Get complete details for a User Story work item by ID. Returns all fields including title, description, acceptance criteria, story points, state, parent Feature, child Tasks, and comments. Returns an error if the work item exists but is not a User Story.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "number",
        description: "User Story work item ID",
      },
      includeRelations: {
        type: "boolean",
        description: "Include parent Feature, child Tasks, and other relations, default true",
      },
      includeAttachments: {
        type: "boolean",
        description: "Include attachment info, default true",
      },
    },
    required: ["id"],
  },
};

export async function getUserStory(
  client: AdoClient,
  params: z.input<typeof getUserStorySchema>
): Promise<TypedWorkItemDetails> {
  return getTypedWorkItem(client, params, "User Story");
}
