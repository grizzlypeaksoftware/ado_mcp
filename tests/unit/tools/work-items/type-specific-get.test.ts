import { getEpic } from "../../../../src/tools/work-items/get-epic";
import { getFeature } from "../../../../src/tools/work-items/get-feature";
import { getUserStory } from "../../../../src/tools/work-items/get-user-story";
import { getBug } from "../../../../src/tools/work-items/get-bug";
import { getTask } from "../../../../src/tools/work-items/get-task";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockWitApi,
  createMockAdoClient,
} from "../../../mocks/work-item-fixtures";

describe("Type-Specific Get Tools", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  const createMockWorkItem = (type: string, additionalFields: Record<string, unknown> = {}) => ({
    id: 123,
    rev: 1,
    fields: {
      "System.Id": 123,
      "System.Title": `Test ${type}`,
      "System.State": "Active",
      "System.WorkItemType": type,
      "System.AssignedTo": { displayName: "Test User" },
      "System.Description": "<p>Test description</p>",
      "System.AreaPath": "TestProject\\Area1",
      "System.IterationPath": "TestProject\\Sprint1",
      "Microsoft.VSTS.Common.Priority": 2,
      "System.Tags": "tag1; tag2",
      "System.CreatedDate": new Date("2024-01-01T00:00:00Z"),
      "System.ChangedDate": new Date("2024-01-02T00:00:00Z"),
      "System.CreatedBy": { displayName: "Creator User" },
      "System.ChangedBy": { displayName: "Editor User" },
      "System.TeamProject": "TestProject",
      ...additionalFields,
    },
    relations: [
      {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: "https://dev.azure.com/testorg/_apis/wit/workItems/100",
        attributes: { name: "Parent" },
      },
    ],
    url: "https://dev.azure.com/testorg/_apis/wit/workItems/123",
  });

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClient(mockWitApi);
  });

  describe("getEpic", () => {
    it("should return Epic with all fields", async () => {
      const epicFields = {
        "Microsoft.VSTS.Common.ValueArea": "Business",
        "Microsoft.VSTS.Scheduling.StartDate": new Date("2024-01-01"),
        "Microsoft.VSTS.Scheduling.TargetDate": new Date("2024-06-01"),
      };
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Epic", epicFields));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getEpic(mockClient as unknown as AdoClient, { id: 123 });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Epic");
      expect(result.title).toBe("Test Epic");
      expect(result.valueArea).toBe("Business");
      expect(result.description).toBe("Test description");
    });

    it("should throw error when work item is not an Epic", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Bug"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      await expect(
        getEpic(mockClient as unknown as AdoClient, { id: 123 })
      ).rejects.toThrow("Work item 123 is a Bug, not a Epic");
    });

    it("should throw error when work item not found", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(null);

      await expect(
        getEpic(mockClient as unknown as AdoClient, { id: 999 })
      ).rejects.toThrow("Work item 999 not found");
    });

    it("should throw error when id is missing", async () => {
      await expect(
        getEpic(mockClient as unknown as AdoClient, {} as { id: number })
      ).rejects.toThrow();
    });
  });

  describe("getFeature", () => {
    it("should return Feature with all fields", async () => {
      const featureFields = {
        "Microsoft.VSTS.Common.ValueArea": "Architectural",
        "Microsoft.VSTS.Scheduling.TargetDate": new Date("2024-03-01"),
      };
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Feature", featureFields));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getFeature(mockClient as unknown as AdoClient, { id: 123 });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Feature");
      expect(result.valueArea).toBe("Architectural");
    });

    it("should throw error when work item is not a Feature", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("User Story"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      await expect(
        getFeature(mockClient as unknown as AdoClient, { id: 123 })
      ).rejects.toThrow("Work item 123 is a User Story, not a Feature");
    });
  });

  describe("getUserStory", () => {
    it("should return User Story with acceptance criteria and story points", async () => {
      const storyFields = {
        "Microsoft.VSTS.Common.AcceptanceCriteria": "<p>Given/When/Then</p>",
        "Microsoft.VSTS.Scheduling.StoryPoints": 5,
        "Microsoft.VSTS.Common.ValueArea": "Business",
      };
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("User Story", storyFields));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getUserStory(mockClient as unknown as AdoClient, { id: 123 });

      expect(result.id).toBe(123);
      expect(result.type).toBe("User Story");
      expect(result.acceptanceCriteria).toBe("Given/When/Then");
      expect(result.storyPoints).toBe(5);
    });

    it("should throw error when work item is not a User Story", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Task"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      await expect(
        getUserStory(mockClient as unknown as AdoClient, { id: 123 })
      ).rejects.toThrow("Work item 123 is a Task, not a User Story");
    });
  });

  describe("getBug", () => {
    it("should return Bug with repro steps, system info, and severity", async () => {
      const bugFields = {
        "Microsoft.VSTS.TCM.ReproSteps": "<ol><li>Step 1</li><li>Step 2</li></ol>",
        "Microsoft.VSTS.TCM.SystemInfo": "<p>Windows 11, Chrome 120</p>",
        "Microsoft.VSTS.Common.Severity": "2 - High",
        "Microsoft.VSTS.Build.FoundIn": "1.0.0",
        "Microsoft.VSTS.Build.IntegrationBuild": "1.0.1",
      };
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Bug", bugFields));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getBug(mockClient as unknown as AdoClient, { id: 123 });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Bug");
      expect(result.reproSteps).toContain("Step 1");
      expect(result.systemInfo).toContain("Windows 11");
      expect(result.severity).toBe("2 - High");
      expect(result.foundIn).toBe("1.0.0");
      expect(result.integratedIn).toBe("1.0.1");
    });

    it("should throw error when work item is not a Bug", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Epic"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      await expect(
        getBug(mockClient as unknown as AdoClient, { id: 123 })
      ).rejects.toThrow("Work item 123 is a Epic, not a Bug");
    });
  });

  describe("getTask", () => {
    it("should return Task with work tracking fields", async () => {
      const taskFields = {
        "Microsoft.VSTS.Scheduling.OriginalEstimate": 8,
        "Microsoft.VSTS.Scheduling.RemainingWork": 4,
        "Microsoft.VSTS.Scheduling.CompletedWork": 4,
        "Microsoft.VSTS.Common.Activity": "Development",
      };
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Task", taskFields));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getTask(mockClient as unknown as AdoClient, { id: 123 });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Task");
      expect(result.originalEstimate).toBe(8);
      expect(result.remainingWork).toBe(4);
      expect(result.completedWork).toBe(4);
      expect(result.activity).toBe("Development");
    });

    it("should throw error when work item is not a Task", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Feature"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      await expect(
        getTask(mockClient as unknown as AdoClient, { id: 123 })
      ).rejects.toThrow("Work item 123 is a Feature, not a Task");
    });
  });

  describe("common functionality", () => {
    it("should format HTML descriptions to plain text", async () => {
      const fields = {
        "System.Description": "<p>This is <strong>formatted</strong> text</p>",
      };
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Epic", fields));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getEpic(mockClient as unknown as AdoClient, { id: 123 });

      expect(result.description).toBe("This is formatted text");
    });

    it("should include relations when includeRelations is true", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Epic"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getEpic(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: true,
      });

      expect(result.relations).toHaveLength(1);
      expect(result.relations![0].attributes.name).toBe("Parent");
    });

    it("should exclude relations when includeRelations is false", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Epic"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getEpic(mockClient as unknown as AdoClient, {
        id: 123,
        includeRelations: false,
      });

      expect(result.relations).toEqual([]);
    });

    it("should parse tags correctly", async () => {
      mockWitApi.getWorkItem.mockResolvedValue(createMockWorkItem("Epic"));
      mockWitApi.getComments.mockResolvedValue({ comments: [] });

      const result = await getEpic(mockClient as unknown as AdoClient, { id: 123 });

      expect(result.tags).toEqual(["tag1", "tag2"]);
    });

    it("should handle API errors", async () => {
      mockWitApi.getWorkItem.mockRejectedValue(new Error("API Error"));

      await expect(
        getEpic(mockClient as unknown as AdoClient, { id: 123 })
      ).rejects.toThrow("API Error");
    });
  });
});
