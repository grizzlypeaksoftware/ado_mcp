import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { createTypedWorkItemBaseSchema, createTypedWorkItem, CreatedWorkItem } from "./create-typed-work-item.js";

export const createUserStorySchema = createTypedWorkItemBaseSchema.extend({
  acceptanceCriteria: z.string().optional().describe("Acceptance criteria (supports HTML)"),
  storyPoints: z.number().optional().describe("Story points estimate"),
  valueArea: z.enum(["Business", "Architectural"]).optional().describe("Value area: Business or Architectural"),
});

export const createUserStoryTool = {
  name: "create_user_story",
  description: "Create a new User Story work item. User Stories describe functionality from the user's perspective, typically broken into Tasks. Supports setting title, description, acceptance criteria, story points, parent Feature, priority, and tags.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      title: {
        type: "string",
        description: "User Story title",
      },
      description: {
        type: "string",
        description: "Story description",
      },
      acceptanceCriteria: {
        type: "string",
        description: "Acceptance criteria (supports HTML)",
      },
      assignedTo: {
        type: "string",
        description: "Email or display name",
      },
      areaPath: {
        type: "string",
        description: "Area path",
      },
      iterationPath: {
        type: "string",
        description: "Iteration/sprint path",
      },
      parentId: {
        type: "number",
        description: "Parent Feature ID to link to",
      },
      priority: {
        type: "number",
        description: "Priority (1-4)",
      },
      storyPoints: {
        type: "number",
        description: "Story points estimate",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags to apply",
      },
      valueArea: {
        type: "string",
        enum: ["Business", "Architectural"],
        description: "Value area: Business or Architectural",
      },
      additionalFields: {
        type: "object",
        description: "Key-value pairs for custom fields",
      },
    },
    required: ["title"],
  },
};

export async function createUserStory(
  client: AdoClient,
  params: z.infer<typeof createUserStorySchema>
): Promise<CreatedWorkItem> {
  const validatedParams = createUserStorySchema.parse(params);

  // Build type-specific fields
  const typeSpecificFields: Record<string, unknown> = {};

  if (validatedParams.acceptanceCriteria) {
    typeSpecificFields["Microsoft.VSTS.Common.AcceptanceCriteria"] = validatedParams.acceptanceCriteria;
  }
  if (validatedParams.storyPoints !== undefined) {
    typeSpecificFields["Microsoft.VSTS.Scheduling.StoryPoints"] = validatedParams.storyPoints;
  }
  if (validatedParams.valueArea) {
    typeSpecificFields["Microsoft.VSTS.Common.ValueArea"] = validatedParams.valueArea;
  }

  return createTypedWorkItem(client, "User Story", validatedParams, typeSpecificFields);
}
