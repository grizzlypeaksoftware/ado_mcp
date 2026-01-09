// Mock response data for Azure DevOps API
// Based on actual ADO API response structures

export const mockUser = {
  id: "user-123-guid",
  displayName: "Test User",
  uniqueName: "testuser@example.com",
  url: "https://dev.azure.com/testorg/_apis/identities/user-123-guid",
  imageUrl: "https://dev.azure.com/testorg/_apis/GraphProfile/MemberAvatars/user-123-guid",
};

export const mockProject = {
  id: "project-123-guid",
  name: "TestProject",
  description: "A test project",
  url: "https://dev.azure.com/testorg/_apis/projects/project-123-guid",
  state: "wellFormed",
  visibility: "private",
};

export const mockWorkItem = {
  id: 123,
  rev: 1,
  fields: {
    "System.Id": 123,
    "System.Title": "Test Work Item",
    "System.State": "Active",
    "System.WorkItemType": "Bug",
    "System.AssignedTo": {
      displayName: "Test User",
      uniqueName: "testuser@example.com",
    },
    "System.Description": "This is a test description",
    "System.AreaPath": "TestProject\\Area1",
    "System.IterationPath": "TestProject\\Sprint1",
    "Microsoft.VSTS.Common.Priority": 2,
    "System.Tags": "tag1; tag2",
    "System.CreatedDate": "2024-01-01T00:00:00Z",
    "System.ChangedDate": "2024-01-02T00:00:00Z",
    "System.CreatedBy": {
      displayName: "Creator User",
      uniqueName: "creator@example.com",
    },
    "System.ChangedBy": {
      displayName: "Editor User",
      uniqueName: "editor@example.com",
    },
  },
  relations: [
    {
      rel: "System.LinkTypes.Hierarchy-Reverse",
      url: "https://dev.azure.com/testorg/_apis/wit/workItems/100",
      attributes: {
        name: "Parent",
      },
    },
  ],
  url: "https://dev.azure.com/testorg/_apis/wit/workItems/123",
};

export const mockWorkItemQueryResult = {
  queryType: "flat",
  queryResultType: "workItem",
  asOf: "2024-01-01T00:00:00Z",
  workItems: [
    { id: 123, url: "https://dev.azure.com/testorg/_apis/wit/workItems/123" },
    { id: 124, url: "https://dev.azure.com/testorg/_apis/wit/workItems/124" },
  ],
};

export const mockRepository = {
  id: "repo-123-guid",
  name: "TestRepo",
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid",
  remoteUrl: "https://dev.azure.com/testorg/TestProject/_git/TestRepo",
  defaultBranch: "refs/heads/main",
  project: {
    id: "project-123-guid",
    name: "TestProject",
  },
};

export const mockBranch = {
  name: "refs/heads/main",
  objectId: "abc123def456",
  creator: mockUser,
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid/refs/heads/main",
};

export const mockBranchStats = {
  name: "refs/heads/feature",
  aheadCount: 5,
  behindCount: 2,
  commit: {
    commitId: "abc123def456",
  },
};

export const mockCommit = {
  commitId: "abc123def456789",
  author: {
    name: "Test Author",
    email: "author@example.com",
    date: "2024-01-01T12:00:00Z",
  },
  committer: {
    name: "Test Committer",
    email: "committer@example.com",
    date: "2024-01-01T12:00:00Z",
  },
  comment: "Test commit message",
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid/commits/abc123def456789",
  changeCounts: {
    Add: 1,
    Edit: 2,
    Delete: 0,
  },
  changes: [
    {
      item: {
        path: "/src/file.ts",
      },
      changeType: "edit",
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

export const mockGitTreeEntry = {
  objectId: "tree-object-id",
  relativePath: "src",
  mode: "40000",
  gitObjectType: "tree",
  size: 0,
  isFolder: true,
  url: "https://dev.azure.com/testorg/TestProject/_apis/git/repositories/repo-123-guid/items?path=/src",
};

export const mockWorkItemComment = {
  id: 1,
  text: "This is a test comment",
  createdBy: mockUser,
  createdDate: "2024-01-01T12:00:00Z",
  modifiedBy: mockUser,
  modifiedDate: "2024-01-01T12:00:00Z",
};
