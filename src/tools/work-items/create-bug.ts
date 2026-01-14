import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { createTypedWorkItemBaseSchema, createTypedWorkItem, CreatedWorkItem } from "./create-typed-work-item.js";

export const createBugSchema = createTypedWorkItemBaseSchema.omit({ description: true }).extend({
  reproSteps: z.string().optional().describe("Steps to reproduce the bug (supports HTML)"),
  systemInfo: z.string().optional().describe("System information where the bug was found"),
  severity: z.enum(["1 - Critical", "2 - High", "3 - Medium", "4 - Low"]).optional().describe("Bug severity"),
  foundIn: z.string().optional().describe("Build version where the bug was found"),
});

export const createBugTool = {
  name: "create_bug",
  description: "Create a new Bug work item. Bugs track defects, errors, or issues that need to be fixed. Supports setting title, repro steps, system info, severity, priority, found-in build, parent work item, and tags.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      title: {
        type: "string",
        description: "Bug title",
      },
      reproSteps: {
        type: "string",
        description: "Steps to reproduce the bug (supports HTML)",
      },
      systemInfo: {
        type: "string",
        description: "System information where the bug was found",
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
      severity: {
        type: "string",
        enum: ["1 - Critical", "2 - High", "3 - Medium", "4 - Low"],
        description: "Bug severity",
      },
      foundIn: {
        type: "string",
        description: "Build version where the bug was found",
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

export async function createBug(
  client: AdoClient,
  params: z.infer<typeof createBugSchema>
): Promise<CreatedWorkItem> {
  const validatedParams = createBugSchema.parse(params);

  // Build type-specific fields
  const typeSpecificFields: Record<string, unknown> = {};

  if (validatedParams.reproSteps) {
    typeSpecificFields["Microsoft.VSTS.TCM.ReproSteps"] = validatedParams.reproSteps;
  }
  if (validatedParams.systemInfo) {
    typeSpecificFields["Microsoft.VSTS.TCM.SystemInfo"] = validatedParams.systemInfo;
  }
  if (validatedParams.severity) {
    typeSpecificFields["Microsoft.VSTS.Common.Severity"] = validatedParams.severity;
  }
  if (validatedParams.foundIn) {
    typeSpecificFields["Microsoft.VSTS.Build.FoundIn"] = validatedParams.foundIn;
  }

  return createTypedWorkItem(client, "Bug", validatedParams, typeSpecificFields);
}
