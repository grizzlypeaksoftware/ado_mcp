import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

export const getPipelineLogsSchema = z.object({
  project: z.string().optional().describe("Project name, defaults to ADO_PROJECT env var"),
  pipelineId: z.number().describe("Pipeline ID"),
  runId: z.number().describe("Run ID"),
  logId: z.number().optional().describe("Specific log ID (from run details)"),
});

export const getPipelineLogsTool = {
  name: "get_pipeline_logs",
  description: "Get logs for a pipeline run",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: {
        type: "string",
        description: "Project name, defaults to ADO_PROJECT env var",
      },
      pipelineId: {
        type: "number",
        description: "Pipeline ID",
      },
      runId: {
        type: "number",
        description: "Run ID",
      },
      logId: {
        type: "number",
        description: "Specific log ID (from run details)",
      },
    },
    required: ["pipelineId", "runId"],
  },
};

export interface PipelineLogsResult {
  runId: number;
  logId?: number;
  content: string;
  lineCount: number;
}

export async function getPipelineLogs(
  client: AdoClient,
  params: z.infer<typeof getPipelineLogsSchema>
): Promise<PipelineLogsResult> {
  const validatedParams = getPipelineLogsSchema.parse(params);
  const project = client.resolveProject(validatedParams.project);

  const buildApi = await client.getBuildApi();

  if (validatedParams.logId) {
    // Get specific log
    const logLines = await buildApi.getBuildLogLines(
      project,
      validatedParams.runId,
      validatedParams.logId
    );

    const content = logLines ? logLines.join("\n") : "";

    return {
      runId: validatedParams.runId,
      logId: validatedParams.logId,
      content,
      lineCount: logLines ? logLines.length : 0,
    };
  }

  // Get all logs and concatenate them
  const logs = await buildApi.getBuildLogs(project, validatedParams.runId);

  if (!logs || logs.length === 0) {
    return {
      runId: validatedParams.runId,
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
        validatedParams.runId,
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
    runId: validatedParams.runId,
    content,
    lineCount: allContent.length,
  };
}
