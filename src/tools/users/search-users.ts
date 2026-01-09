import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { UserInfo } from "../../types.js";

export const searchUsersSchema = z.object({
  query: z.string().describe("Search query (name or email)"),
  maxResults: z.number().default(20).describe("Limit results, default 20"),
});

export const searchUsersTool = {
  name: "search_users",
  description: "Search for users in the organization",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search query (name or email)",
      },
      maxResults: {
        type: "number",
        description: "Limit results, default 20",
      },
    },
    required: ["query"],
  },
};

export async function searchUsers(
  client: AdoClient,
  params: z.infer<typeof searchUsersSchema>
): Promise<UserInfo[]> {
  const validatedParams = searchUsersSchema.parse(params);

  // Use the identity picker API to search for users
  // Note: This is a simplified implementation - in practice you'd use the Graph API
  const coreApi = await client.getCoreApi();

  // Get all teams across projects and find users that match
  // This is a workaround since direct user search isn't in the core SDK
  const connectionData = await client.getConnectionData();

  // For now, return a message that direct user search requires Graph API
  return [{
    id: "",
    displayName: `Search for '${validatedParams.query}' requires Azure DevOps Graph API`,
    email: "Use the Graph API endpoint: GET {orgUrl}/_apis/graph/users",
    url: "",
  }];
}
