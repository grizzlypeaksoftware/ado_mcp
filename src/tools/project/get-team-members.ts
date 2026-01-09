import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { UserInfo } from "../../types.js";

export const getTeamMembersSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().describe("Team name or ID"),
});

export const getTeamMembersTool = {
  name: "get_team_members",
  description: "Get members of a team",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      team: {
        type: "string",
        description: "Team name or ID",
      },
    },
    required: ["team"],
  },
};

export async function getTeamMembers(
  client: AdoClient,
  params: z.infer<typeof getTeamMembersSchema>
): Promise<UserInfo[]> {
  const validatedParams = getTeamMembersSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const coreApi = await client.getCoreApi();
  const members = await coreApi.getTeamMembersWithExtendedProperties(
    project,
    validatedParams.team
  );

  if (!members) {
    return [];
  }

  return members.map((member) => ({
    id: member.identity?.id || "",
    displayName: member.identity?.displayName || "",
    email: member.identity?.uniqueName,
    url: member.identity?.url || "",
  }));
}
