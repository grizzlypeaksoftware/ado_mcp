import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { createTypedWorkItemBaseSchema, createTypedWorkItem, CreatedWorkItem } from "./create-typed-work-item.js";

export const createEpicSchema = createTypedWorkItemBaseSchema.extend({
  startDate: z.string().optional().describe("Planned start date (ISO format)"),
  targetDate: z.string().optional().describe("Target completion date (ISO format)"),
  valueArea: z.enum(["Business", "Architectural"]).optional().describe("Value area: Business or Architectural"),
}).omit({ parentId: true }); // Epics don't have parents in standard Agile process

export const createEpicTool = {
  name: "create_epic",
  description: "Create a new Epic work item. Epics are the highest-level work items representing large initiatives or themes. Supports setting title, description, assignee, area/iteration paths, priority, dates, and tags.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      title: {
        type: "string",
        description: "Epic title",
      },
      description: {
        type: "string",
        description: "Epic description/scope",
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
      priority: {
        type: "number",
        description: "Priority (1-4)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags to apply",
      },
      startDate: {
        type: "string",
        description: "Planned start date (ISO format)",
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

export async function createEpic(
  client: AdoClient,
  params: z.infer<typeof createEpicSchema>
): Promise<CreatedWorkItem> {
  const validatedParams = createEpicSchema.parse(params);

  // Build type-specific fields
  const typeSpecificFields: Record<string, unknown> = {};

  if (validatedParams.startDate) {
    typeSpecificFields["Microsoft.VSTS.Scheduling.StartDate"] = validatedParams.startDate;
  }
  if (validatedParams.targetDate) {
    typeSpecificFields["Microsoft.VSTS.Scheduling.TargetDate"] = validatedParams.targetDate;
  }
  if (validatedParams.valueArea) {
    typeSpecificFields["Microsoft.VSTS.Common.ValueArea"] = validatedParams.valueArea;
  }

  return createTypedWorkItem(client, "Epic", validatedParams, typeSpecificFields);
}
