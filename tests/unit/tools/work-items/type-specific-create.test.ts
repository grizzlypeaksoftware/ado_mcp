import { createEpic } from "../../../../src/tools/work-items/create-epic";
import { createFeature } from "../../../../src/tools/work-items/create-feature";
import { createUserStory } from "../../../../src/tools/work-items/create-user-story";
import { createBug } from "../../../../src/tools/work-items/create-bug";
import { createTask } from "../../../../src/tools/work-items/create-task";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockWitApi,
  createMockAdoClient,
} from "../../../mocks/work-item-fixtures";

describe("Type-Specific Create Tools", () => {
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClient>;

  const createMockCreatedWorkItem = (type: string, id: number = 123) => ({
    id,
    rev: 1,
    fields: {
      "System.Id": id,
      "System.Title": `New ${type}`,
      "System.State": "New",
      "System.WorkItemType": type,
    },
    url: `https://dev.azure.com/testorg/_apis/wit/workItems/${id}`,
  });

  beforeEach(() => {
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClient(mockWitApi);
  });

  describe("createEpic", () => {
    it("should create Epic with title only", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Epic"));

      const result = await createEpic(mockClient as unknown as AdoClient, {
        title: "New Epic",
      });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Epic");
      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/System.Title", value: "New Epic" }),
        ]),
        "TestProject",
        "Epic"
      );
    });

    it("should create Epic with all optional fields", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Epic"));

      const result = await createEpic(mockClient as unknown as AdoClient, {
        title: "New Epic",
        description: "Epic description",
        assignedTo: "user@example.com",
        areaPath: "Project\\Area",
        iterationPath: "Project\\Sprint1",
        priority: 1,
        tags: ["important", "q1"],
        startDate: "2024-01-01",
        targetDate: "2024-06-01",
        valueArea: "Business",
      });

      expect(result.id).toBe(123);
      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/System.Title" }),
          expect.objectContaining({ path: "/fields/System.Description" }),
          expect.objectContaining({ path: "/fields/System.AssignedTo" }),
          expect.objectContaining({ path: "/fields/System.AreaPath" }),
          expect.objectContaining({ path: "/fields/System.IterationPath" }),
          expect.objectContaining({ path: "/fields/Microsoft.VSTS.Common.Priority" }),
          expect.objectContaining({ path: "/fields/System.Tags" }),
          expect.objectContaining({ path: "/fields/Microsoft.VSTS.Scheduling.StartDate" }),
          expect.objectContaining({ path: "/fields/Microsoft.VSTS.Scheduling.TargetDate" }),
          expect.objectContaining({ path: "/fields/Microsoft.VSTS.Common.ValueArea" }),
        ]),
        "TestProject",
        "Epic"
      );
    });

    it("should throw error when title is missing", async () => {
      await expect(
        createEpic(mockClient as unknown as AdoClient, {} as { title: string })
      ).rejects.toThrow();
    });

    it("should throw error on API failure", async () => {
      mockWitApi.createWorkItem.mockRejectedValue(new Error("API Error"));

      await expect(
        createEpic(mockClient as unknown as AdoClient, { title: "Test" })
      ).rejects.toThrow("API Error");
    });
  });

  describe("createFeature", () => {
    it("should create Feature with parent Epic", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Feature"));

      const result = await createFeature(mockClient as unknown as AdoClient, {
        title: "New Feature",
        parentId: 100,
      });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Feature");
      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/System.Title" }),
          expect.objectContaining({
            path: "/relations/-",
            value: expect.objectContaining({
              rel: "System.LinkTypes.Hierarchy-Reverse",
            }),
          }),
        ]),
        "TestProject",
        "Feature"
      );
    });

    it("should create Feature with value area and target date", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Feature"));

      await createFeature(mockClient as unknown as AdoClient, {
        title: "New Feature",
        valueArea: "Architectural",
        targetDate: "2024-03-01",
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/Microsoft.VSTS.Common.ValueArea", value: "Architectural" }),
          expect.objectContaining({ path: "/fields/Microsoft.VSTS.Scheduling.TargetDate", value: "2024-03-01" }),
        ]),
        "TestProject",
        "Feature"
      );
    });
  });

  describe("createUserStory", () => {
    it("should create User Story with acceptance criteria and story points", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("User Story"));

      const result = await createUserStory(mockClient as unknown as AdoClient, {
        title: "New User Story",
        acceptanceCriteria: "Given/When/Then criteria",
        storyPoints: 5,
      });

      expect(result.id).toBe(123);
      expect(result.type).toBe("User Story");
      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/System.Title" }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
            value: "Given/When/Then criteria",
          }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Scheduling.StoryPoints",
            value: 5,
          }),
        ]),
        "TestProject",
        "User Story"
      );
    });

    it("should create User Story with parent Feature", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("User Story"));

      await createUserStory(mockClient as unknown as AdoClient, {
        title: "New User Story",
        parentId: 50,
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({
            path: "/relations/-",
            value: expect.objectContaining({
              url: expect.stringContaining("/workItems/50"),
            }),
          }),
        ]),
        "TestProject",
        "User Story"
      );
    });

    it("should handle zero story points", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("User Story"));

      await createUserStory(mockClient as unknown as AdoClient, {
        title: "New User Story",
        storyPoints: 0,
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Scheduling.StoryPoints",
            value: 0,
          }),
        ]),
        "TestProject",
        "User Story"
      );
    });
  });

  describe("createBug", () => {
    it("should create Bug with repro steps and severity", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Bug"));

      const result = await createBug(mockClient as unknown as AdoClient, {
        title: "New Bug",
        reproSteps: "<ol><li>Step 1</li><li>Step 2</li></ol>",
        severity: "2 - High",
      });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Bug");
      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/System.Title" }),
          expect.objectContaining({ path: "/fields/Microsoft.VSTS.TCM.ReproSteps" }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Common.Severity",
            value: "2 - High",
          }),
        ]),
        "TestProject",
        "Bug"
      );
    });

    it("should create Bug with system info and found-in build", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Bug"));

      await createBug(mockClient as unknown as AdoClient, {
        title: "New Bug",
        systemInfo: "Windows 11, Chrome 120",
        foundIn: "1.0.0-beta",
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.TCM.SystemInfo",
            value: "Windows 11, Chrome 120",
          }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Build.FoundIn",
            value: "1.0.0-beta",
          }),
        ]),
        "TestProject",
        "Bug"
      );
    });

    it("should validate severity enum", async () => {
      await expect(
        createBug(mockClient as unknown as AdoClient, {
          title: "Test",
          severity: "Invalid" as "1 - Critical",
        })
      ).rejects.toThrow();
    });
  });

  describe("createTask", () => {
    it("should create Task with work tracking fields", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Task"));

      const result = await createTask(mockClient as unknown as AdoClient, {
        title: "New Task",
        originalEstimate: 8,
        remainingWork: 8,
        activity: "Development",
      });

      expect(result.id).toBe(123);
      expect(result.type).toBe("Task");
      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/System.Title" }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate",
            value: 8,
          }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
            value: 8,
          }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Common.Activity",
            value: "Development",
          }),
        ]),
        "TestProject",
        "Task"
      );
    });

    it("should create Task with parent User Story", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Task"));

      await createTask(mockClient as unknown as AdoClient, {
        title: "New Task",
        parentId: 75,
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({
            path: "/relations/-",
            value: expect.objectContaining({
              url: expect.stringContaining("/workItems/75"),
            }),
          }),
        ]),
        "TestProject",
        "Task"
      );
    });

    it("should handle zero work estimates", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Task"));

      await createTask(mockClient as unknown as AdoClient, {
        title: "New Task",
        originalEstimate: 0,
        remainingWork: 0,
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate",
            value: 0,
          }),
          expect.objectContaining({
            path: "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
            value: 0,
          }),
        ]),
        "TestProject",
        "Task"
      );
    });
  });

  describe("common functionality", () => {
    it("should join tags with semicolon", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Epic"));

      await createEpic(mockClient as unknown as AdoClient, {
        title: "Test",
        tags: ["tag1", "tag2", "tag3"],
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({
            path: "/fields/System.Tags",
            value: "tag1; tag2; tag3",
          }),
        ]),
        "TestProject",
        "Epic"
      );
    });

    it("should validate priority range", async () => {
      await expect(
        createEpic(mockClient as unknown as AdoClient, {
          title: "Test",
          priority: 5,
        })
      ).rejects.toThrow();

      await expect(
        createEpic(mockClient as unknown as AdoClient, {
          title: "Test",
          priority: 0,
        })
      ).rejects.toThrow();
    });

    it("should pass additional custom fields", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Epic"));

      await createEpic(mockClient as unknown as AdoClient, {
        title: "Test",
        additionalFields: {
          "Custom.Field1": "value1",
          "Custom.Field2": 42,
        },
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ path: "/fields/Custom.Field1", value: "value1" }),
          expect.objectContaining({ path: "/fields/Custom.Field2", value: 42 }),
        ]),
        "TestProject",
        "Epic"
      );
    });

    it("should handle creation failure", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(null);

      await expect(
        createEpic(mockClient as unknown as AdoClient, { title: "Test" })
      ).rejects.toThrow("Failed to create Epic");
    });

    it("should use project from params if provided", async () => {
      mockWitApi.createWorkItem.mockResolvedValue(createMockCreatedWorkItem("Epic"));
      mockClient.resolveProject.mockReturnValue("CustomProject");

      await createEpic(mockClient as unknown as AdoClient, {
        title: "Test",
        project: "CustomProject",
      });

      expect(mockClient.resolveProject).toHaveBeenCalledWith("CustomProject");
      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        undefined,
        expect.any(Array),
        "CustomProject",
        "Epic"
      );
    });
  });
});
