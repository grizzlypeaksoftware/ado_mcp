// Comprehensive mock fixtures for all API types
import { mockUser, mockProject, mockRepository, mockBranch, mockCommit, mockWorkItem } from "./ado-responses";

// Re-export commonly used mocks
export { mockUser, mockProject, mockRepository, mockBranch, mockCommit, mockWorkItem };

// ============ PULL REQUEST FIXTURES ============
export const mockPullRequest = {
  pullRequestId: 1,
  title: "Test PR",
  description: "Test description",
  status: 1, // active
  sourceRefName: "refs/heads/feature",
  targetRefName: "refs/heads/main",
  createdBy: mockUser,
  creationDate: new Date("2024-01-01"),
  repository: mockRepository,
  reviewers: [
    { id: "reviewer-1", displayName: "Reviewer 1", vote: 0, isRequired: true },
  ],
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/pullRequests/1",
};

export const mockPullRequestComment = {
  id: 1,
  content: "Test comment",
  author: mockUser,
  publishedDate: new Date("2024-01-01"),
  lastUpdatedDate: new Date("2024-01-01"),
};

export const mockPullRequestThread = {
  id: 1,
  comments: [mockPullRequestComment],
  status: 1,
  threadContext: null,
};

// ============ PIPELINE/BUILD FIXTURES ============
export const mockBuildDefinition = {
  id: 1,
  name: "Test Pipeline",
  path: "\\",
  revision: 5,
  createdDate: new Date("2024-01-01"),
  queue: { id: 1, name: "Default" },
  repository: { id: "repo-123", name: "TestRepo", type: "TfsGit", defaultBranch: "refs/heads/main" },
  process: { yamlFilename: "azure-pipelines.yml" },
  url: "https://dev.azure.com/testorg/TestProject/_apis/build/definitions/1",
};

export const mockBuild = {
  id: 100,
  buildNumber: "20240101.1",
  status: 2, // completed
  result: 2, // succeeded
  queueTime: new Date("2024-01-01T10:00:00Z"),
  startTime: new Date("2024-01-01T10:01:00Z"),
  finishTime: new Date("2024-01-01T10:10:00Z"),
  sourceBranch: "refs/heads/main",
  sourceVersion: "abc123",
  definition: { id: 1, name: "Test Pipeline" },
  requestedBy: mockUser,
  requestedFor: mockUser,
  url: "https://dev.azure.com/testorg/TestProject/_apis/build/builds/100",
};

export const mockBuildLog = {
  id: 1,
  type: "Container",
  lineCount: 100,
  createdOn: new Date("2024-01-01"),
  url: "https://dev.azure.com/testorg/TestProject/_apis/build/builds/100/logs/1",
};

// ============ RELEASE FIXTURES ============
export const mockReleaseDefinition = {
  id: 1,
  name: "Test Release",
  path: "\\",
  revision: 3,
  createdBy: mockUser,
  createdOn: new Date("2024-01-01"),
  environments: [
    { id: 1, name: "Dev", rank: 1 },
    { id: 2, name: "Prod", rank: 2 },
  ],
  artifacts: [
    { alias: "build", type: "Build", definitionReference: { definition: { id: "1", name: "Test Pipeline" } } },
  ],
  url: "https://dev.azure.com/testorg/TestProject/_apis/release/definitions/1",
};

export const mockRelease = {
  id: 10,
  name: "Release-10",
  status: "active",
  createdBy: mockUser,
  createdOn: new Date("2024-01-01"),
  modifiedBy: mockUser,
  modifiedOn: new Date("2024-01-01"),
  releaseDefinition: { id: 1, name: "Test Release" },
  environments: [
    { id: 1, name: "Dev", status: "succeeded" },
    { id: 2, name: "Prod", status: "notStarted" },
  ],
  artifacts: [],
  url: "https://dev.azure.com/testorg/TestProject/_apis/release/releases/10",
};

export const mockReleaseEnvironment = {
  id: 1,
  name: "Dev",
  status: "succeeded",
  deploySteps: [
    {
      id: 1,
      attempt: 1,
      status: "succeeded",
      releaseDeployPhases: [{ deploymentJobs: [{ job: { id: 1 }, tasks: [] }] }],
    },
  ],
};

// ============ BOARD FIXTURES ============
export const mockBoard = {
  id: "board-1",
  name: "Stories",
  columns: [
    { id: "col-1", name: "New", itemLimit: 0 },
    { id: "col-2", name: "Active", itemLimit: 5 },
    { id: "col-3", name: "Done", itemLimit: 0 },
  ],
  rows: [
    { id: "row-1", name: "Default" },
  ],
  url: "https://dev.azure.com/testorg/TestProject/_apis/work/boards/Stories",
};

export const mockBoardColumn = {
  id: "col-1",
  name: "Active",
  itemLimit: 5,
  stateMappings: { Bug: "Active" },
  isSplit: false,
};

export const mockBoardRow = {
  id: "row-1",
  name: "Expedite",
};

// ============ TEAM/ITERATION FIXTURES ============
export const mockTeam = {
  id: "team-123",
  name: "Test Team",
  description: "A test team",
  url: "https://dev.azure.com/testorg/_apis/teams/team-123",
};

export const mockTeamMember = {
  identity: mockUser,
  isTeamAdmin: false,
};

export const mockIteration = {
  id: "iteration-1",
  name: "Sprint 1",
  path: "TestProject\\Sprint 1",
  attributes: {
    startDate: new Date("2024-01-01"),
    finishDate: new Date("2024-01-14"),
    timeFrame: "current",
  },
  url: "https://dev.azure.com/testorg/TestProject/_apis/work/iterations/iteration-1",
};

export const mockAreaPath = {
  id: 1,
  identifier: "area-1",
  name: "Area 1",
  path: "TestProject\\Area 1",
  hasChildren: true,
  children: [],
  url: "https://dev.azure.com/testorg/TestProject/_apis/wit/classificationnodes/areas/Area%201",
};

// ============ WIKI FIXTURES ============
export const mockWiki = {
  id: "wiki-1",
  name: "TestWiki",
  type: 0, // projectWiki
  url: "https://dev.azure.com/testorg/TestProject/_apis/wiki/wikis/wiki-1",
};

export const mockWikiPage = {
  id: 1,
  path: "/Home",
  content: "# Home\nWelcome to the wiki",
  gitItemPath: "/Home.md",
  order: 0,
  isParentPage: true,
  url: "https://dev.azure.com/testorg/TestProject/_apis/wiki/wikis/wiki-1/pages/Home",
};

// ============ TEST PLAN FIXTURES ============
export const mockTestPlan = {
  id: 1,
  name: "Test Plan 1",
  state: "Active",
  owner: mockUser,
  area: { name: "TestProject" },
  iteration: "TestProject\\Sprint 1",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-14"),
  url: "https://dev.azure.com/testorg/TestProject/_apis/testplan/plans/1",
};

export const mockTestSuite = {
  id: 1,
  name: "Suite 1",
  suiteType: "StaticTestSuite",
  testCaseCount: 5,
  url: "https://dev.azure.com/testorg/TestProject/_apis/testplan/plans/1/suites/1",
};

export const mockTestRun = {
  id: 1,
  name: "Test Run 1",
  state: "Completed",
  totalTests: 10,
  passedTests: 8,
  unanalyzedTests: 0,
  startedDate: new Date("2024-01-01"),
  completedDate: new Date("2024-01-01"),
  url: "https://dev.azure.com/testorg/TestProject/_apis/test/runs/1",
};

export const mockTestResult = {
  id: 1,
  testCaseTitle: "Test Case 1",
  outcome: "Passed",
  state: "Completed",
  durationInMs: 1000,
  runBy: mockUser,
  completedDate: new Date("2024-01-01"),
};

// ============ ARTIFACT FIXTURES ============
export const mockFeed = {
  id: "feed-1",
  name: "TestFeed",
  description: "A test feed",
  url: "https://dev.azure.com/testorg/_apis/packaging/feeds/feed-1",
};

export const mockPackage = {
  id: "pkg-1",
  name: "test-package",
  protocolType: "npm",
  url: "https://dev.azure.com/testorg/_apis/packaging/feeds/feed-1/packages/pkg-1",
  versions: [{ version: "1.0.0", publishDate: new Date("2024-01-01") }],
};

// ============ VARIABLE GROUP FIXTURES ============
export const mockVariableGroup = {
  id: 1,
  name: "Test Variables",
  description: "Test variable group",
  type: "Vsts",
  createdBy: mockUser,
  createdOn: new Date("2024-01-01"),
  modifiedBy: mockUser,
  modifiedOn: new Date("2024-01-01"),
  variables: {
    VAR1: { value: "value1", isSecret: false },
    SECRET_VAR: { value: null, isSecret: true },
  },
};

// ============ POLICY FIXTURES ============
export const mockPolicy = {
  id: 1,
  type: { id: "policy-type-1", displayName: "Minimum reviewers" },
  isEnabled: true,
  isBlocking: true,
  settings: { minimumApproverCount: 2 },
  url: "https://dev.azure.com/testorg/TestProject/_apis/policy/configurations/1",
};

// ============ ATTACHMENT FIXTURES ============
export const mockAttachment = {
  id: "attachment-1",
  url: "https://dev.azure.com/testorg/_apis/wit/attachments/attachment-1",
};

// ============ MOCK API CREATORS ============
export function createMockGitApi() {
  return {
    getRepositories: jest.fn(),
    getRepository: jest.fn(),
    getBranches: jest.fn(),
    getBranch: jest.fn(),
    getCommits: jest.fn(),
    getCommit: jest.fn(),
    getItem: jest.fn(),
    getItems: jest.fn(),
    createPush: jest.fn(),
    updateRef: jest.fn(),
    updateRefs: jest.fn(),
    getPullRequests: jest.fn(),
    getPullRequest: jest.fn(),
    createPullRequest: jest.fn(),
    updatePullRequest: jest.fn(),
    createPullRequestReviewer: jest.fn(),
    deletePullRequestReviewer: jest.fn(),
    getThreads: jest.fn(),
    createThread: jest.fn(),
    getPullRequestWorkItemRefs: jest.fn(),
    getPullRequestCommits: jest.fn(),
  };
}

export function createMockBuildApi() {
  return {
    getDefinitions: jest.fn(),
    getDefinition: jest.fn(),
    getBuilds: jest.fn(),
    getBuild: jest.fn(),
    queueBuild: jest.fn(),
    updateBuild: jest.fn(),
    getBuildLogs: jest.fn(),
    getBuildLog: jest.fn(),
    getBuildLogLines: jest.fn(),
    getBuildTimeline: jest.fn(),
  };
}

export function createMockReleaseApi() {
  return {
    getReleaseDefinitions: jest.fn(),
    getReleaseDefinition: jest.fn(),
    getReleases: jest.fn(),
    getRelease: jest.fn(),
    createRelease: jest.fn(),
    updateReleaseEnvironment: jest.fn(),
    updateReleaseApproval: jest.fn(),
    getLogs: jest.fn(),
  };
}

export function createMockWorkApi() {
  return {
    getBoards: jest.fn(),
    getBoard: jest.fn(),
    getBoardColumns: jest.fn(),
    getBoardRows: jest.fn(),
    updateBoardColumn: jest.fn(),
    getTeamIterations: jest.fn(),
    getTeamIteration: jest.fn(),
  };
}

export function createMockCoreApi() {
  return {
    getProjects: jest.fn(),
    getProject: jest.fn(),
    getTeams: jest.fn(),
    getTeamMembersWithExtendedProperties: jest.fn(),
  };
}

export function createMockWikiApi() {
  return {
    getAllWikis: jest.fn(),
    getWiki: jest.fn(),
  };
}

export function createMockTestApi() {
  return {
    getTestRuns: jest.fn(),
    getTestResults: jest.fn(),
  };
}

export function createMockTaskAgentApi() {
  return {
    getVariableGroups: jest.fn(),
    getVariableGroup: jest.fn(),
  };
}

export function createMockPolicyApi() {
  return {
    getPolicyConfigurations: jest.fn(),
    getPolicyConfiguration: jest.fn(),
  };
}

export function createMockWitApi() {
  return {
    queryByWiql: jest.fn(),
    getWorkItem: jest.fn(),
    getWorkItems: jest.fn(),
    createWorkItem: jest.fn(),
    updateWorkItem: jest.fn(),
    deleteWorkItem: jest.fn(),
    addComment: jest.fn(),
    getComments: jest.fn(),
    createAttachment: jest.fn(),
    getClassificationNode: jest.fn(),
  };
}

export function createMockAdoClientFull(mocks: {
  witApi?: ReturnType<typeof createMockWitApi>;
  gitApi?: ReturnType<typeof createMockGitApi>;
  buildApi?: ReturnType<typeof createMockBuildApi>;
  releaseApi?: ReturnType<typeof createMockReleaseApi>;
  workApi?: ReturnType<typeof createMockWorkApi>;
  coreApi?: ReturnType<typeof createMockCoreApi>;
  wikiApi?: ReturnType<typeof createMockWikiApi>;
  testApi?: ReturnType<typeof createMockTestApi>;
  taskAgentApi?: ReturnType<typeof createMockTaskAgentApi>;
  policyApi?: ReturnType<typeof createMockPolicyApi>;
}) {
  return {
    getWorkItemTrackingApi: jest.fn().mockResolvedValue(mocks.witApi || createMockWitApi()),
    getGitApi: jest.fn().mockResolvedValue(mocks.gitApi || createMockGitApi()),
    getBuildApi: jest.fn().mockResolvedValue(mocks.buildApi || createMockBuildApi()),
    getReleaseApi: jest.fn().mockResolvedValue(mocks.releaseApi || createMockReleaseApi()),
    getWorkApi: jest.fn().mockResolvedValue(mocks.workApi || createMockWorkApi()),
    getCoreApi: jest.fn().mockResolvedValue(mocks.coreApi || createMockCoreApi()),
    getWikiApi: jest.fn().mockResolvedValue(mocks.wikiApi || createMockWikiApi()),
    getTestApi: jest.fn().mockResolvedValue(mocks.testApi || createMockTestApi()),
    getTaskAgentApi: jest.fn().mockResolvedValue(mocks.taskAgentApi || createMockTaskAgentApi()),
    getPolicyApi: jest.fn().mockResolvedValue(mocks.policyApi || createMockPolicyApi()),
    resolveProject: jest.fn((p?: string) => p || "TestProject"),
    getOrgUrl: jest.fn().mockReturnValue("https://dev.azure.com/testorg"),
  };
}
