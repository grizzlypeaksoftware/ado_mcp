import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const listIterationsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  team: z.string().optional().describe("Team name, defaults to project default team"),
  timeframe: z
    .enum(["past", "current", "future", "all"])
    .default("all")
    .describe("Filter by timeframe"),
});

export const listIterationsTool = {
  name: "list_iterations",
  description: "List iterations/sprints for a project",
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
      timeframe: {
        type: "string",
        enum: ["past", "current", "future", "all"],
        description: "Filter by timeframe, default 'all'",
      },
    },
    required: [],
  },
};

export interface IterationInfo {
  id: string;
  name: string;
  path: string;
  startDate?: string;
  endDate?: string;
  state: string;
  url: string;
}

export async function listIterations(
  client: AdoClient,
  params: z.infer<typeof listIterationsSchema>
): Promise<IterationInfo[]> {
  const validatedParams = listIterationsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const workApi = await client.getWorkApi();
  const teamContext = {
    project: project,
    team: validatedParams.team,
  };

  // Map timeframe to API value
  let timeframe: string | undefined;
  if (validatedParams.timeframe !== "all") {
    timeframe = validatedParams.timeframe;
  }

  const iterations = await workApi.getTeamIterations(teamContext, timeframe);

  if (!iterations) {
    return [];
  }

  return iterations.map((iteration) => ({
    id: iteration.id || "",
    name: iteration.name || "",
    path: iteration.path || "",
    startDate: iteration.attributes?.startDate?.toISOString(),
    endDate: iteration.attributes?.finishDate?.toISOString(),
    state: iteration.attributes?.timeFrame !== undefined
      ? getTimeframeString(iteration.attributes.timeFrame)
      : "",
    url: iteration.url || "",
  }));
}

function getTimeframeString(timeFrame: number): string {
  switch (timeFrame) {
    case 0:
      return "past";
    case 1:
      return "current";
    case 2:
      return "future";
    default:
      return "unknown";
  }
}
