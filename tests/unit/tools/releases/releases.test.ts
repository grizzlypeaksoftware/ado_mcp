import { listReleaseDefinitions } from "../../../../src/tools/releases/list-release-definitions";
import { getReleaseDefinition } from "../../../../src/tools/releases/get-release-definition";
import { listReleases } from "../../../../src/tools/releases/list-releases";
import { getRelease } from "../../../../src/tools/releases/get-release";
import { createRelease } from "../../../../src/tools/releases/create-release";
import { deployRelease } from "../../../../src/tools/releases/deploy-release";
import { getReleaseEnvironment } from "../../../../src/tools/releases/get-release-environment";
import { approveRelease } from "../../../../src/tools/releases/approve-release";
import { getReleaseLogs } from "../../../../src/tools/releases/get-release-logs";
import { AdoClient } from "../../../../src/ado-client";
import {
  createMockReleaseApi,
  createMockAdoClientFull,
  mockReleaseDefinition,
  mockRelease,
  mockReleaseEnvironment,
} from "../../../mocks/api-fixtures";

describe("Release Tools", () => {
  let mockReleaseApi: ReturnType<typeof createMockReleaseApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockReleaseApi = createMockReleaseApi();
    mockClient = createMockAdoClientFull({ releaseApi: mockReleaseApi });
  });

  describe("listReleaseDefinitions", () => {
    it("should list release definitions", async () => {
      mockReleaseApi.getReleaseDefinitions.mockResolvedValue([mockReleaseDefinition]);

      const result = await listReleaseDefinitions(mockClient as unknown as AdoClient, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe("Test Release");
    });

    it("should filter by name", async () => {
      mockReleaseApi.getReleaseDefinitions.mockResolvedValue([mockReleaseDefinition]);

      await listReleaseDefinitions(mockClient as unknown as AdoClient, {
        searchText: "Test",
      });

      expect(mockReleaseApi.getReleaseDefinitions).toHaveBeenCalled();
      const callArgs = mockReleaseApi.getReleaseDefinitions.mock.calls[0];
      expect(callArgs[0]).toBe("TestProject");
      expect(callArgs[1]).toBe("Test");
    });

    it("should return empty array when no definitions found", async () => {
      mockReleaseApi.getReleaseDefinitions.mockResolvedValue([]);

      const result = await listReleaseDefinitions(mockClient as unknown as AdoClient, {});

      expect(result).toEqual([]);
    });
  });

  describe("getReleaseDefinition", () => {
    it("should get release definition details", async () => {
      mockReleaseApi.getReleaseDefinition.mockResolvedValue(mockReleaseDefinition);

      const result = await getReleaseDefinition(mockClient as unknown as AdoClient, {
        definitionId: 1,
      });

      expect(result.id).toBe(1);
      expect(result.name).toBe("Test Release");
      expect(result.environments).toHaveLength(2);
    });

    it("should throw error when definition not found", async () => {
      mockReleaseApi.getReleaseDefinition.mockResolvedValue(null);

      await expect(
        getReleaseDefinition(mockClient as unknown as AdoClient, { definitionId: 999 })
      ).rejects.toThrow("Release definition 999 not found");
    });
  });

  describe("listReleases", () => {
    it("should list releases", async () => {
      mockReleaseApi.getReleases.mockResolvedValue([mockRelease]);

      const result = await listReleases(mockClient as unknown as AdoClient, {} as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(10);
      expect(result[0].name).toBe("Release-10");
    });

    it("should filter by definition", async () => {
      mockReleaseApi.getReleases.mockResolvedValue([mockRelease]);

      await listReleases(mockClient as unknown as AdoClient, {
        definitionId: 1,
      } as any);

      expect(mockReleaseApi.getReleases).toHaveBeenCalled();
    });
  });

  describe("getRelease", () => {
    it("should get release details", async () => {
      mockReleaseApi.getRelease.mockResolvedValue(mockRelease);

      const result = await getRelease(mockClient as unknown as AdoClient, {
        releaseId: 10,
      });

      expect(result.id).toBe(10);
      expect(result.name).toBe("Release-10");
      expect(result.environments).toHaveLength(2);
    });

    it("should throw error when release not found", async () => {
      mockReleaseApi.getRelease.mockResolvedValue(null);

      await expect(
        getRelease(mockClient as unknown as AdoClient, { releaseId: 999 })
      ).rejects.toThrow("Release 999 not found");
    });
  });

  describe("createRelease", () => {
    it("should create a new release", async () => {
      mockReleaseApi.createRelease.mockResolvedValue({
        ...mockRelease,
        id: 11,
        name: "Release-11",
      });

      const result = await createRelease(mockClient as unknown as AdoClient, {
        definitionId: 1,
      } as any);

      expect(result.id).toBe(11);
      expect(result.message).toContain("Successfully created");
    });

    it("should create with description", async () => {
      mockReleaseApi.createRelease.mockResolvedValue(mockRelease);

      await createRelease(mockClient as unknown as AdoClient, {
        definitionId: 1,
        description: "Test release description",
      } as any);

      const releaseArg = mockReleaseApi.createRelease.mock.calls[0][0];
      expect(releaseArg.description).toBe("Test release description");
    });
  });

  describe("deployRelease", () => {
    it("should deploy to an environment", async () => {
      mockReleaseApi.updateReleaseEnvironment.mockResolvedValue({
        ...mockReleaseEnvironment,
        status: "inProgress",
      });

      const result = await deployRelease(mockClient as unknown as AdoClient, {
        releaseId: 10,
        environmentId: 1,
      }) as any;

      expect(result.status).toBe("inProgress");
    });
  });

  describe("getReleaseEnvironment", () => {
    it("should get environment status", async () => {
      mockReleaseApi.getRelease.mockResolvedValue({
        ...mockRelease,
        environments: [{ ...mockReleaseEnvironment, status: 4 }], // 4 = succeeded
      });

      const result = await getReleaseEnvironment(mockClient as unknown as AdoClient, {
        releaseId: 10,
        environmentId: 1,
      });

      expect(result.id).toBe(1);
      expect(result.name).toBe("Dev");
      expect(result.status).toBe("succeeded");
    });

    it("should throw error when environment not found", async () => {
      mockReleaseApi.getRelease.mockResolvedValue({
        ...mockRelease,
        environments: [],
      });

      await expect(
        getReleaseEnvironment(mockClient as unknown as AdoClient, {
          releaseId: 10,
          environmentId: 999,
        })
      ).rejects.toThrow("Environment 999 not found");
    });
  });

  describe("approveRelease", () => {
    it("should approve a release", async () => {
      mockReleaseApi.updateReleaseApproval.mockResolvedValue({
        id: 1,
        status: "approved",
      });

      const result = await approveRelease(mockClient as unknown as AdoClient, {
        releaseId: 10,
        approvalId: 1,
        status: "approved",
      });

      expect(result.status).toBe("approved");
      expect(result.releaseId).toBe(10);
      expect(result.message).toContain("approved");
    });

    it("should reject a release with comment", async () => {
      mockReleaseApi.updateReleaseApproval.mockResolvedValue({
        id: 1,
        status: "rejected",
      });

      await approveRelease(mockClient as unknown as AdoClient, {
        releaseId: 10,
        approvalId: 1,
        status: "rejected",
        comment: "Not ready for production",
      });

      const approvalArg = mockReleaseApi.updateReleaseApproval.mock.calls[0][0];
      expect(approvalArg.comments).toBe("Not ready for production");
    });
  });

  describe("getReleaseLogs", () => {
    it("should get release logs", async () => {
      mockReleaseApi.getRelease.mockResolvedValue({
        ...mockRelease,
        environments: [{
          ...mockReleaseEnvironment,
          id: 1,
          deploySteps: [{
            id: 1,
            releaseDeployPhases: [{
              deploymentJobs: [{
                tasks: [{ id: 1, name: "Build", logUrl: "https://logs/1" }]
              }]
            }]
          }]
        }],
      });

      const result = await getReleaseLogs(mockClient as unknown as AdoClient, {
        releaseId: 10,
        environmentId: 1,
      });

      expect(result.releaseId).toBe(10);
      expect(result.environmentId).toBe(1);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].taskName).toBe("Build");
    });
  });
});
