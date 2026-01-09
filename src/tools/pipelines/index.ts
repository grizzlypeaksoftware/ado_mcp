import { AdoClient } from "../../ado-client.js";

// Import all pipeline tools
import { listPipelinesTool, listPipelines } from "./list-pipelines.js";
import { getPipelineTool, getPipeline } from "./get-pipeline.js";
import { listPipelineRunsTool, listPipelineRuns } from "./list-pipeline-runs.js";
import { getPipelineRunTool, getPipelineRun } from "./get-pipeline-run.js";
import { runPipelineTool, runPipeline } from "./run-pipeline.js";
import { cancelPipelineRunTool, cancelPipelineRun } from "./cancel-pipeline-run.js";
import { getPipelineLogsTool, getPipelineLogs } from "./get-pipeline-logs.js";

// Export all tool definitions
export const pipelineTools = [
  listPipelinesTool,
  getPipelineTool,
  listPipelineRunsTool,
  getPipelineRunTool,
  runPipelineTool,
  cancelPipelineRunTool,
  getPipelineLogsTool,
];

// Tool handler router
export async function handlePipelineTool(
  client: AdoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case "list_pipelines":
      return listPipelines(client, args as Parameters<typeof listPipelines>[1]);
    case "get_pipeline":
      return getPipeline(client, args as Parameters<typeof getPipeline>[1]);
    case "list_pipeline_runs":
      return listPipelineRuns(client, args as Parameters<typeof listPipelineRuns>[1]);
    case "get_pipeline_run":
      return getPipelineRun(client, args as Parameters<typeof getPipelineRun>[1]);
    case "run_pipeline":
      return runPipeline(client, args as Parameters<typeof runPipeline>[1]);
    case "cancel_pipeline_run":
      return cancelPipelineRun(client, args as Parameters<typeof cancelPipelineRun>[1]);
    case "get_pipeline_logs":
      return getPipelineLogs(client, args as Parameters<typeof getPipelineLogs>[1]);
    default:
      throw new Error(`Unknown pipeline tool: ${toolName}`);
  }
}

// Re-export individual tools
export {
  listPipelinesTool,
  listPipelines,
  getPipelineTool,
  getPipeline,
  listPipelineRunsTool,
  listPipelineRuns,
  getPipelineRunTool,
  getPipelineRun,
  runPipelineTool,
  runPipeline,
  cancelPipelineRunTool,
  cancelPipelineRun,
  getPipelineLogsTool,
  getPipelineLogs,
};
