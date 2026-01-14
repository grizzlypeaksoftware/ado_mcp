import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getBuildLogsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  buildId: z.number().describe("Build ID"),
  logId: z.number().optional().describe("Specific log ID"),
});

export const getBuildLogsTool = {
  name: "get_build_logs",
  description: "Retrieve console output logs from a build. Get all logs concatenated or specify a logId for a specific task's output. Use this to troubleshoot failed builds, review test output, or audit what commands were executed.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      buildId: {
        type: "number",
        description: "Build ID",
      },
      logId: {
        type: "number",
        description: "Specific log ID",
      },
    },
    required: ["buildId"],
  },
};

export interface BuildLogsResult {
  buildId: number;
  logId?: number;
  content: string;
  lineCount: number;
}

export async function getBuildLogs(
  client: AdoClient,
  params: z.infer<typeof getBuildLogsSchema>
): Promise<BuildLogsResult> {
  const validatedParams = getBuildLogsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  if (validatedParams.logId) {
    // Get specific log
    const logLines = await buildApi.getBuildLogLines(
      project,
      validatedParams.buildId,
      validatedParams.logId
    );

    const content = logLines ? logLines.join("\n") : "";

    return {
      buildId: validatedParams.buildId,
      logId: validatedParams.logId,
      content,
      lineCount: logLines ? logLines.length : 0,
    };
  }

  // Get all logs and concatenate them
  const logs = await buildApi.getBuildLogs(project, validatedParams.buildId);

  if (!logs || logs.length === 0) {
    return {
      buildId: validatedParams.buildId,
      content: "",
      lineCount: 0,
    };
  }

  // Get all log content
  const allContent: string[] = [];
  for (const log of logs) {
    if (log.id) {
      const logLines = await buildApi.getBuildLogLines(
        project,
        validatedParams.buildId,
        log.id
      );
      if (logLines) {
        allContent.push(`=== Log ${log.id} ===`);
        allContent.push(...logLines);
        allContent.push("");
      }
    }
  }

  const content = allContent.join("\n");

  return {
    buildId: validatedParams.buildId,
    content,
    lineCount: allContent.length,
  };
}
