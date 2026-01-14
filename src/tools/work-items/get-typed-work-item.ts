import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { WorkItemDetails, WorkItemRelation, WorkItemAttachment } from "../../types.js";
import { WorkItemExpand } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { formatDescription } from "../../utils/html-to-text.js";

/**
 * Base schema for type-specific get operations
 */
export const getTypedWorkItemSchema = z.object({
  id: z.number().describe("Work item ID"),
  includeRelations: z.boolean().default(true).describe("Include linked items"),
  includeAttachments: z.boolean().default(true).describe("Include attachment info"),
});

/**
 * Extended WorkItemDetails with type-specific fields
 */
export interface TypedWorkItemDetails extends WorkItemDetails {
  // Epic/Feature specific
  valueArea?: string;
  startDate?: string;
  targetDate?: string;
  // User Story specific
  acceptanceCriteria?: string;
  storyPoints?: number;
  // Bug specific
  reproSteps?: string;
  systemInfo?: string;
  severity?: string;
  foundIn?: string;
  integratedIn?: string;
  // Task specific
  originalEstimate?: number;
  remainingWork?: number;
  completedWork?: number;
  activity?: string;
}

/**
 * Fetches a work item and validates it matches the expected type.
 * Returns full details with type-specific fields and formatted descriptions.
 */
export async function getTypedWorkItem(
  client: AdoClient,
  params: z.input<typeof getTypedWorkItemSchema>,
  expectedType: string
): Promise<TypedWorkItemDetails> {
  const validatedParams = getTypedWorkItemSchema.parse(params);

  const witApi = await client.getWorkItemTrackingApi();

  // Always expand all to get relations
  const expand = validatedParams.includeRelations || validatedParams.includeAttachments
    ? WorkItemExpand.All
    : WorkItemExpand.Fields;

  const workItem = await witApi.getWorkItem(
    validatedParams.id,
    undefined,
    undefined,
    expand
  );

  if (!workItem || !workItem.fields) {
    throw new Error(`Work item ${validatedParams.id} not found`);
  }

  const fields = workItem.fields;
  const actualType = fields["System.WorkItemType"] as string;

  // Validate work item type
  if (actualType !== expectedType) {
    throw new Error(
      `Work item ${validatedParams.id} is a ${actualType}, not a ${expectedType}`
    );
  }

  // Parse relations
  let relations: WorkItemRelation[] = [];
  if (validatedParams.includeRelations && workItem.relations) {
    relations = workItem.relations
      .filter((r) => r.rel && r.url && r.rel !== "AttachedFile")
      .map((r) => ({
        rel: r.rel || "",
        url: r.url || "",
        attributes: {
          name: r.attributes?.name,
          comment: r.attributes?.comment,
        },
      }));
  }

  // Parse attachments from relations
  let attachments: WorkItemAttachment[] = [];
  if (validatedParams.includeAttachments && workItem.relations) {
    attachments = workItem.relations
      .filter((r) => r.rel === "AttachedFile")
      .map((r) => ({
        id: r.url?.split("/").pop() || "",
        name: r.attributes?.name || "attachment",
        url: r.url || "",
        size: 0,
        uploadDate: "",
      }));
  }

  // Get comments
  let comments;
  try {
    const project = fields["System.TeamProject"] as string;
    const commentsResult = await witApi.getComments(project, validatedParams.id);
    comments = commentsResult.comments?.map((c) => ({
      id: c.id || 0,
      text: formatDescription(c.text) || c.text || "",
      createdBy: c.createdBy?.displayName || "",
      createdDate: c.createdDate?.toISOString() || "",
    }));
  } catch {
    // Comments API might not be available in all versions
    comments = undefined;
  }

  // Parse tags
  const tagsString = fields["System.Tags"] as string | undefined;
  const tags = tagsString ? tagsString.split(";").map((t) => t.trim()) : undefined;

  // Build the result with formatted descriptions
  const result: TypedWorkItemDetails = {
    id: workItem.id || 0,
    title: fields["System.Title"] || "",
    state: fields["System.State"] || "",
    type: actualType,
    assignedTo: fields["System.AssignedTo"]?.displayName,
    description: formatDescription(fields["System.Description"]),
    areaPath: fields["System.AreaPath"] || "",
    iterationPath: fields["System.IterationPath"] || "",
    priority: fields["Microsoft.VSTS.Common.Priority"],
    tags,
    createdDate: fields["System.CreatedDate"]?.toISOString?.() || String(fields["System.CreatedDate"] || ""),
    changedDate: fields["System.ChangedDate"]?.toISOString?.() || String(fields["System.ChangedDate"] || ""),
    createdBy: fields["System.CreatedBy"]?.displayName || "",
    changedBy: fields["System.ChangedBy"]?.displayName || "",
    relations,
    attachments,
    comments,
    url: workItem.url || "",
  };

  // Add type-specific fields based on work item type
  switch (expectedType) {
    case "Epic":
    case "Feature":
      result.valueArea = fields["Microsoft.VSTS.Common.ValueArea"];
      result.startDate = fields["Microsoft.VSTS.Scheduling.StartDate"]?.toISOString?.()
        || String(fields["Microsoft.VSTS.Scheduling.StartDate"] || "") || undefined;
      result.targetDate = fields["Microsoft.VSTS.Scheduling.TargetDate"]?.toISOString?.()
        || String(fields["Microsoft.VSTS.Scheduling.TargetDate"] || "") || undefined;
      break;

    case "User Story":
      result.acceptanceCriteria = formatDescription(fields["Microsoft.VSTS.Common.AcceptanceCriteria"]);
      result.storyPoints = fields["Microsoft.VSTS.Scheduling.StoryPoints"];
      result.valueArea = fields["Microsoft.VSTS.Common.ValueArea"];
      break;

    case "Bug":
      result.reproSteps = formatDescription(fields["Microsoft.VSTS.TCM.ReproSteps"]);
      result.systemInfo = formatDescription(fields["Microsoft.VSTS.TCM.SystemInfo"]);
      result.severity = fields["Microsoft.VSTS.Common.Severity"];
      result.foundIn = fields["Microsoft.VSTS.Build.FoundIn"];
      result.integratedIn = fields["Microsoft.VSTS.Build.IntegrationBuild"];
      break;

    case "Task":
      result.originalEstimate = fields["Microsoft.VSTS.Scheduling.OriginalEstimate"];
      result.remainingWork = fields["Microsoft.VSTS.Scheduling.RemainingWork"];
      result.completedWork = fields["Microsoft.VSTS.Scheduling.CompletedWork"];
      result.activity = fields["Microsoft.VSTS.Common.Activity"];
      break;
  }

  // Clean up undefined values
  return JSON.parse(JSON.stringify(result));
}
