import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import * as ReleaseInterfaces from "azure-devops-node-api/interfaces/ReleaseInterfaces";

export const approveReleaseSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  releaseId: z.number().describe("Release ID"),
  approvalId: z.number().describe("Approval ID"),
  status: z.enum(["approved", "rejected"]).describe("Approval status"),
  comment: z.string().optional().describe("Approval comment"),
});

export const approveReleaseTool = {
  name: "approve_release",
  description: "Approve a pending release deployment",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      releaseId: {
        type: "number",
        description: "Release ID",
      },
      approvalId: {
        type: "number",
        description: "Approval ID",
      },
      status: {
        type: "string",
        enum: ["approved", "rejected"],
        description: "Approval status - 'approved' or 'rejected'",
      },
      comment: {
        type: "string",
        description: "Approval comment",
      },
    },
    required: ["releaseId", "approvalId", "status"],
  },
};

export interface ApproveReleaseResult {
  id: number;
  releaseId: number;
  status: string;
  message: string;
}

export async function approveRelease(
  client: AdoClient,
  params: z.infer<typeof approveReleaseSchema>
): Promise<ApproveReleaseResult> {
  const validatedParams = approveReleaseSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const releaseApi = await client.getReleaseApi();

  // Map status
  const approvalStatus =
    validatedParams.status === "approved"
      ? ReleaseInterfaces.ApprovalStatus.Approved
      : ReleaseInterfaces.ApprovalStatus.Rejected;

  const approval: ReleaseInterfaces.ReleaseApproval = {
    status: approvalStatus,
    comments: validatedParams.comment,
  };

  const updatedApproval = await releaseApi.updateReleaseApproval(
    approval,
    project,
    validatedParams.approvalId
  );

  if (!updatedApproval) {
    throw new Error(`Failed to update approval ${validatedParams.approvalId}`);
  }

  return {
    id: validatedParams.approvalId,
    releaseId: validatedParams.releaseId,
    status: validatedParams.status,
    message: `Successfully ${validatedParams.status} release approval ${validatedParams.approvalId}`,
  };
}
