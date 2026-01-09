// Test fixtures for git tools

export const mockRepository = {
  id: "repo-123-guid",
  name: "TestRepo",
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid",
  remoteUrl: "https://dev.azure.com/testorg/TestProject/_git/TestRepo",
  defaultBranch: "refs/heads/main",
  size: 12345,
  sshUrl: "git@ssh.dev.azure.com:v3/testorg/TestProject/TestRepo",
  webUrl: "https://dev.azure.com/testorg/TestProject/_git/TestRepo",
  project: {
    id: "project-123-guid",
    name: "TestProject",
  },
};

export const mockRepositories = [
  mockRepository,
  {
    id: "repo-456-guid",
    name: "AnotherRepo",
    url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-456-guid",
    remoteUrl: "https://dev.azure.com/testorg/TestProject/_git/AnotherRepo",
    defaultBranch: "refs/heads/main",
    project: {
      id: "project-123-guid",
      name: "TestProject",
    },
  },
];

export const mockBranchRef = {
  name: "refs/heads/main",
  objectId: "abc123def456789",
  creator: {
    displayName: "Test User",
    uniqueName: "testuser@example.com",
  },
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid/refs/heads/main",
};

export const mockBranchRefs = [
  mockBranchRef,
  {
    name: "refs/heads/feature",
    objectId: "def456abc789",
    creator: {
      displayName: "Another User",
    },
  },
];

export const mockBranchStats = [
  {
    name: "refs/heads/main",
    aheadCount: 0,
    behindCount: 0,
    commit: { commitId: "abc123def456789" },
  },
  {
    name: "refs/heads/feature",
    aheadCount: 5,
    behindCount: 2,
    commit: { commitId: "def456abc789" },
  },
];

export const mockCommit = {
  commitId: "abc123def456789",
  author: {
    name: "Test Author",
    email: "author@example.com",
    date: new Date("2024-01-01T12:00:00Z"),
  },
  committer: {
    name: "Test Committer",
    email: "committer@example.com",
    date: new Date("2024-01-01T12:00:00Z"),
  },
  comment: "Test commit message",
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid/commits/abc123def456789",
  changeCounts: {
    Add: 1,
    Edit: 2,
    Delete: 0,
  },
};

export const mockCommits = [
  mockCommit,
  {
    commitId: "def456abc789",
    author: {
      name: "Another Author",
      email: "another@example.com",
      date: new Date("2024-01-02T12:00:00Z"),
    },
    committer: {
      name: "Another Author",
      email: "another@example.com",
      date: new Date("2024-01-02T12:00:00Z"),
    },
    comment: "Another commit",
    url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid/commits/def456abc789",
  },
];

export const mockCommitChanges = {
  changeCounts: { Add: 1, Edit: 2, Delete: 0 },
  changes: [
    {
      item: { path: "/src/file.ts" },
      changeType: 2, // Edit
    },
    {
      item: { path: "/src/new.ts" },
      changeType: 1, // Add
    },
  ],
};

export const mockGitItem = {
  objectId: "item-object-id",
  gitObjectType: "blob",
  path: "/src/file.ts",
  isFolder: false,
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid/items?path=/src/file.ts",
  commitId: "abc123def456",
};

export const mockGitItems = [
  {
    path: "/",
    isFolder: true,
    url: "url1",
  },
  {
    path: "/src",
    isFolder: true,
    url: "url2",
  },
  {
    path: "/README.md",
    isFolder: false,
    url: "url3",
    commitId: "abc123",
  },
];

export const mockRefUpdateResult = [
  {
    success: true,
    name: "refs/heads/new-branch",
    oldObjectId: "0000000000000000000000000000000000000000",
    newObjectId: "abc123def456789",
  },
];

export function createMockGitApi() {
  return {
    getRepositories: jest.fn(),
    getRepository: jest.fn(),
    getRefs: jest.fn(),
    getBranches: jest.fn(),
    getCommits: jest.fn(),
    getCommit: jest.fn(),
    getChanges: jest.fn(),
    getItem: jest.fn(),
    getItemContent: jest.fn(),
    getItems: jest.fn(),
    updateRefs: jest.fn(),
  };
}

export function createMockAdoClient(mockGitApi: ReturnType<typeof createMockGitApi>) {
  return {
    getGitApi: jest.fn().mockResolvedValue(mockGitApi),
    resolveProject: jest.fn((p?: string) => p || "TestProject"),
    getOrgUrl: jest.fn().mockReturnValue("https://dev.azure.com/testorg"),
  };
}
