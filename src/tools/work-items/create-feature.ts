import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { createTypedWorkItemBaseSchema, createTypedWorkItem, CreatedWorkItem } from "./create-typed-work-item.js";

export const createFeatureSchema = createTypedWorkItemBaseSchema.extend({
  targetDate: z.string().optional().describe("Target completion date (ISO format)"),
  valueArea: z.enum(["Business", "Architectural"]).optional().describe("Value area: Business or Architectural"),
});

export const createFeatureTool = {
  name: "create_feature",
  description: "Create a new Feature work item. Features represent shippable functionality that delivers value, typically grouped under Epics and containing User Stories. Supports setting title, description, assignee, parent Epic, priority, and tags.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      title: {
        type: "string",
        description: "Feature title",
      },
      description: {
        type: "string",
        description: "Feature description",
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
        description: "Parent Epic ID to link to",
      },
      priority: {
        type: "number",
        description: "Priority (1-4)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags to apply",
      },
      targetDate: {
        type: "string",
        description: "Target completion date (ISO format)",
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

export async function createFeature(
  client: AdoClient,
  params: z.infer<typeof createFeatureSchema>
): Promise<CreatedWorkItem> {
  const validatedParams = createFeatureSchema.parse(params);

  // Build type-specific fields
  const typeSpecificFields: Record<string, unknown> = {};

  if (validatedParams.targetDate) {
    typeSpecificFields["Microsoft.VSTS.Scheduling.TargetDate"] = validatedParams.targetDate;
  }
  if (validatedParams.valueArea) {
    typeSpecificFields["Microsoft.VSTS.Common.ValueArea"] = validatedParams.valueArea;
  }

  return createTypedWorkItem(client, "Feature", validatedParams, typeSpecificFields);
}
