// Test fixtures for work item tools

export const mockWorkItemFields = {
  "System.Id": 123,
  "System.Title": "Test Work Item",
  "System.State": "Active",
  "System.WorkItemType": "Bug",
  "System.AssignedTo": {
    displayName: "Test User",
    uniqueName: "testuser@example.com",
  },
  "System.Description": "<p>Test description</p>",
  "System.AreaPath": "TestProject\\Area1",
  "System.IterationPath": "TestProject\\Sprint1",
  "Microsoft.VSTS.Common.Priority": 2,
  "System.Tags": "tag1; tag2",
  "System.CreatedDate": new Date("2024-01-01T00:00:00Z"),
  "System.ChangedDate": new Date("2024-01-02T00:00:00Z"),
  "System.CreatedBy": {
    displayName: "Creator User",
    uniqueName: "creator@example.com",
  },
  "System.ChangedBy": {
    displayName: "Editor User",
    uniqueName: "editor@example.com",
  },
};

export const mockWorkItem = {
  id: 123,
  rev: 1,
  fields: mockWorkItemFields,
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
  asOf: new Date("2024-01-01T00:00:00Z"),
  workItems: [
    { id: 123, url: "https://dev.azure.com/testorg/_apis/wit/workItems/123" },
    { id: 124, url: "https://dev.azure.com/testorg/_apis/wit/workItems/124" },
  ],
};

export const mockWorkItemsList = [
  {
    id: 123,
    fields: {
      "System.Title": "Bug 1",
      "System.State": "Active",
      "System.WorkItemType": "Bug",
      "System.AssignedTo": { displayName: "User 1" },
    },
    url: "https://dev.azure.com/testorg/_apis/wit/workItems/123",
  },
  {
    id: 124,
    fields: {
      "System.Title": "Bug 2",
      "System.State": "New",
      "System.WorkItemType": "Bug",
      "System.AssignedTo": { displayName: "User 2" },
    },
    url: "https://dev.azure.com/testorg/_apis/wit/workItems/124",
  },
];

export const mockComment = {
  id: 1,
  text: "This is a test comment",
  createdBy: {
    displayName: "Test User",
    uniqueName: "testuser@example.com",
  },
  createdDate: new Date("2024-01-01T12:00:00Z"),
  modifiedBy: {
    displayName: "Test User",
    uniqueName: "testuser@example.com",
  },
  modifiedDate: new Date("2024-01-01T12:00:00Z"),
};

export const mockCommentsResult = {
  comments: [mockComment],
  totalCount: 1,
  count: 1,
};

export function createMockWitApi() {
  return {
    queryByWiql: jest.fn(),
    getWorkItem: jest.fn(),
    getWorkItems: jest.fn(),
    createWorkItem: jest.fn(),
    updateWorkItem: jest.fn(),
    deleteWorkItem: jest.fn(),
    destroyWorkItem: jest.fn(),
    addComment: jest.fn(),
    getComments: jest.fn(),
  };
}

export function createMockAdoClient(mockWitApi: ReturnType<typeof createMockWitApi>) {
  return {
    getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWitApi),
    resolveProject: jest.fn((p?: string) => p || "TestProject"),
    getOrgUrl: jest.fn().mockReturnValue("https://dev.azure.com/testorg"),
  };
}
