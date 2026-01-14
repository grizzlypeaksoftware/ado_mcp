import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { createTypedWorkItemBaseSchema, createTypedWorkItem, CreatedWorkItem } from "./create-typed-work-item.js";

export const createTaskSchema = createTypedWorkItemBaseSchema.extend({
  originalEstimate: z.number().optional().describe("Original estimate in hours"),
  remainingWork: z.number().optional().describe("Remaining work in hours"),
  activity: z.string().optional().describe("Activity type (Development, Testing, Requirements, Design, Deployment, Documentation)"),
});

export const createTaskTool = {
  name: "create_task",
  description: "Create a new Task work item. Tasks are the smallest work units representing specific work to be done, usually under User Stories. Supports setting title, description, work estimates, activity type, parent User Story, priority, and tags.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      title: {
        type: "string",
        description: "Task title",
      },
      description: {
        type: "string",
        description: "Task description",
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
        description: "Parent User Story ID to link to",
      },
      priority: {
        type: "number",
        description: "Priority (1-4)",
      },
      originalEstimate: {
        type: "number",
        description: "Original estimate in hours",
      },
      remainingWork: {
        type: "number",
        description: "Remaining work in hours",
      },
      activity: {
        type: "string",
        description: "Activity type (Development, Testing, Requirements, Design, Deployment, Documentation)",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Tags to apply",
      },
      additionalFields: {
        type: "object",
        description: "Key-value pairs for custom fields",
      },
    },
    required: ["title"],
  },
};

export async function createTask(
  client: AdoClient,
  params: z.infer<typeof createTaskSchema>
): Promise<CreatedWorkItem> {
  const validatedParams = createTaskSchema.parse(params);

  // Build type-specific fields
  const typeSpecificFields: Record<string, unknown> = {};

  if (validatedParams.originalEstimate !== undefined) {
    typeSpecificFields["Microsoft.VSTS.Scheduling.OriginalEstimate"] = validatedParams.originalEstimate;
  }
  if (validatedParams.remainingWork !== undefined) {
    typeSpecificFields["Microsoft.VSTS.Scheduling.RemainingWork"] = validatedParams.remainingWork;
  }
  if (validatedParams.activity) {
    typeSpecificFields["Microsoft.VSTS.Common.Activity"] = validatedParams.activity;
  }

  return createTypedWorkItem(client, "Task", validatedParams, typeSpecificFields);
}
