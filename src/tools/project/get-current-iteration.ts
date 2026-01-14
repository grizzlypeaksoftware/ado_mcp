import { z } from "zod";
import { AdoClient } from "../../ado-client.js";
import { IterationInfo } from "./list-iterations.js";

export const getCurrentIterationSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().optional().describe("Team name, defaults to project default team"),
});

export const getCurrentIterationTool = {
  name: "get_current_iteration",
  description: "Get the currently active iteration (sprint) for a team. Returns the iteration that is in progress right now based on its date range. Useful for finding what sprint the team is working on.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      team: {
        type: "string",
        description: "Team name, defaults to project default team",
      },
    },
    required: [],
  },
};

export async function getCurrentIteration(
  client: AdoClient,
  params: z.infer<typeof getCurrentIterationSchema>
): Promise<IterationInfo | null> {
  const validatedParams = getCurrentIterationSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const workApi = await client.getWorkApi();
  const teamContext = {
    project: project,
    team: validatedParams.team,
  };

  // Get current iterations (timeframe = "current")
  const iterations = await workApi.getTeamIterations(teamContext, "current");

  if (!iterations || iterations.length === 0) {
    return null;
  }

  const iteration = iterations[0];
  return {
    id: iteration.id || "",
    name: iteration.name || "",
    path: iteration.path || "",
    startDate: iteration.attributes?.startDate?.toISOString(),
    endDate: iteration.attributes?.finishDate?.toISOString(),
    state: "current",
    url: iteration.url || "",
  };
}
