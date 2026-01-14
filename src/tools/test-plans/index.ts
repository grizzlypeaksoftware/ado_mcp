import { z } from "zod";
import { AdoClient } from "../../ado-client.js";

// Schemas
const listTestPlansSchema = z.object({
  project: z.string().optional(),
  owner: z.string().optional(),
  includePlanDetails: z.boolean().default(false),
});

const getTestPlanSchema = z.object({
  project: z.string().optional(),
  planId: z.number(),
});

const listTestSuitesSchema = z.object({
  project: z.string().optional(),
  planId: z.number(),
});

const getTestSuiteSchema = z.object({
  project: z.string().optional(),
  planId: z.number(),
  suiteId: z.number(),
});

const listTestCasesSchema = z.object({
  project: z.string().optional(),
  planId: z.number(),
  suiteId: z.number(),
});

const getTestResultsSchema = z.object({
  project: z.string().optional(),
  runId: z.number(),
});

const listTestRunsSchema = z.object({
  project: z.string().optional(),
  planId: z.number().optional(),
  state: z.enum(["unspecified", "notStarted", "inProgress", "completed", "aborted", "waiting"]).optional(),
  maxResults: z.number().default(50),
});

// Tool definitions
export const listTestPlansTool = {
  name: "list_test_plans",
  description: "List test plans in a project. Test plans are containers for organizing test suites and test cases. Filter by owner or include full details. Note: This tool returns REST API guidance as the Test Plans API requires direct calls.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      owner: { type: "string", description: "Filter by owner" },
      includePlanDetails: { type: "boolean", description: "Include full details" },
    },
    required: [],
  },
};

export const getTestPlanTool = {
  name: "get_test_plan",
  description: "Get detailed information about a specific test plan including its area path, iteration, and test suites. Requires a plan ID from list_test_plans. Note: This tool returns REST API guidance.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      planId: { type: "number", description: "Test plan ID" },
    },
    required: ["planId"],
  },
};

export const listTestSuitesTool = {
  name: "list_test_suites",
  description: "List test suites within a test plan. Test suites are folders that organize test cases hierarchically. Requires a plan ID. Note: This tool returns REST API guidance as the Test Plans API requires direct calls.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      planId: { type: "number", description: "Test plan ID" },
    },
    required: ["planId"],
  },
};

export const getTestSuiteTool = {
  name: "get_test_suite",
  description: "Get detailed information about a specific test suite including its type (static, query-based, or requirement-based) and parent suite. Requires plan ID and suite ID. Note: This tool returns REST API guidance.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      planId: { type: "number", description: "Test plan ID" },
      suiteId: { type: "number", description: "Test suite ID" },
    },
    required: ["planId", "suiteId"],
  },
};

export const listTestCasesTool = {
  name: "list_test_cases",
  description: "List test cases within a test suite. Test cases are work items defining the steps to verify a feature. Requires plan ID and suite ID. Note: This tool returns REST API guidance as the Test Plans API requires direct calls.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      planId: { type: "number", description: "Test plan ID" },
      suiteId: { type: "number", description: "Test suite ID" },
    },
    required: ["planId", "suiteId"],
  },
};

export const getTestResultsTool = {
  name: "get_test_results",
  description: "Get test results from a test run, showing pass/fail status, duration, error messages, and stack traces for each test case. Requires a run ID from list_test_runs. Use this to analyze test failures.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      runId: { type: "number", description: "Test run ID" },
    },
    required: ["runId"],
  },
};

export const listTestRunsTool = {
  name: "list_test_runs",
  description: "List test runs (test execution records) in a project. Filter by plan or state (notStarted/inProgress/completed/aborted). Returns run name, total/passed/failed counts, and timing. Use this to track testing progress.",
  inputSchema: {
    type: "object" as const,
    properties: {
      project: { type: "string", description: "Project name" },
      planId: { type: "number", description: "Filter by plan" },
      state: { type: "string", enum: ["unspecified", "notStarted", "inProgress", "completed", "aborted", "waiting"] },
      maxResults: { type: "number", description: "Limit results" },
    },
    required: [],
  },
};

// Implementation functions - Test Plans API requires REST calls for plan/suite management
async function listTestPlans(client: AdoClient, params: z.infer<typeof listTestPlansSchema>) {
  const validated = listTestPlansSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Test Plans API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/testplan/plans`,
    project,
    owner: validated.owner,
  };
}

async function getTestPlan(client: AdoClient, params: z.infer<typeof getTestPlanSchema>) {
  const validated = getTestPlanSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Test Plans API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/testplan/plans/${validated.planId}`,
    project,
    planId: validated.planId,
  };
}

async function listTestSuites(client: AdoClient, params: z.infer<typeof listTestSuitesSchema>) {
  const validated = listTestSuitesSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Test Plans API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/testplan/Plans/${validated.planId}/suites`,
    project,
    planId: validated.planId,
  };
}

async function getTestSuite(client: AdoClient, params: z.infer<typeof getTestSuiteSchema>) {
  const validated = getTestSuiteSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Test Plans API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/testplan/Plans/${validated.planId}/suites/${validated.suiteId}`,
    project,
    planId: validated.planId,
    suiteId: validated.suiteId,
  };
}

async function listTestCases(client: AdoClient, params: z.infer<typeof listTestCasesSchema>) {
  const validated = listTestCasesSchema.parse(params);
  const project = client.resolveProject(validated.project);

  return {
    message: "Test Plans API requires direct REST calls.",
    note: `Use Azure DevOps REST API: GET {orgUrl}/${project}/_apis/testplan/Plans/${validated.planId}/suites/${validated.suiteId}/TestCase`,
    project,
    planId: validated.planId,
    suiteId: validated.suiteId,
  };
}

async function getTestResults(client: AdoClient, params: z.infer<typeof getTestResultsSchema>) {
  const validated = getTestResultsSchema.parse(params);
  const project = client.resolveProject(validated.project);
  const testApi = await client.getTestApi();

  const results = await testApi.getTestResults(project, validated.runId);
  return (results || []).map((r: any) => ({
    id: r.id || 0,
    testCaseTitle: r.testCaseTitle || "",
    outcome: r.outcome || "",
    state: r.state || "",
    duration: r.durationInMs || 0,
    errorMessage: r.errorMessage,
    stackTrace: r.stackTrace,
    runBy: r.runBy?.displayName || "",
    completedDate: r.completedDate?.toISOString(),
  }));
}

async function listTestRuns(client: AdoClient, params: z.infer<typeof listTestRunsSchema>) {
  const validated = listTestRunsSchema.parse(params);
  const project = client.resolveProject(validated.project);
  const testApi = await client.getTestApi();

  const runs = await testApi.getTestRuns(project);
  return (runs || []).slice(0, validated.maxResults).map((r: any) => ({
    id: r.id || 0,
    name: r.name || "",
    state: r.state || "",
    totalTests: r.totalTests || 0,
    passedTests: r.passedTests || 0,
    failedTests: (r.totalTests || 0) - (r.passedTests || 0) - (r.unanalyzedTests || 0),
    startedDate: r.startedDate?.toISOString(),
    completedDate: r.completedDate?.toISOString(),
    url: r.url || "",
  }));
}

export const testPlanTools = [
  listTestPlansTool,
  getTestPlanTool,
  listTestSuitesTool,
  getTestSuiteTool,
  listTestCasesTool,
  getTestResultsTool,
  listTestRunsTool,
];

export async function handleTestPlanTool(client: AdoClient, toolName: string, args: unknown): Promise<unknown> {
  switch (toolName) {
    case "list_test_plans": return listTestPlans(client, args as any);
    case "get_test_plan": return getTestPlan(client, args as any);
    case "list_test_suites": return listTestSuites(client, args as any);
    case "get_test_suite": return getTestSuite(client, args as any);
    case "list_test_cases": return listTestCases(client, args as any);
    case "get_test_results": return getTestResults(client, args as any);
    case "list_test_runs": return listTestRuns(client, args as any);
    default: throw new Error(`Unknown test plan tool: ${toolName}`);
  }
}
