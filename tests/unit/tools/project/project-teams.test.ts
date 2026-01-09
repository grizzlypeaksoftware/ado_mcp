import { AdoClient } from "../../../../src/ado-client";
import { listTeams } from "../../../../src/tools/project/list-teams";
import { getTeamMembers } from "../../../../src/tools/project/get-team-members";
import { listIterations } from "../../../../src/tools/project/list-iterations";
import { getCurrentIteration } from "../../../../src/tools/project/get-current-iteration";
import { listAreaPaths } from "../../../../src/tools/project/list-area-paths";
import {
  createMockCoreApi,
  createMockWorkApi,
  createMockWitApi,
  createMockAdoClientFull,
  mockTeam,
  mockTeamMember,
  mockIteration,
  mockAreaPath,
} from "../../../mocks/api-fixtures";

describe("Project/Team Operations", () => {
  let mockCoreApi: ReturnType<typeof createMockCoreApi>;
  let mockWorkApi: ReturnType<typeof createMockWorkApi>;
  let mockWitApi: ReturnType<typeof createMockWitApi>;
  let mockClient: ReturnType<typeof createMockAdoClientFull>;

  beforeEach(() => {
    mockCoreApi = createMockCoreApi();
    mockWorkApi = createMockWorkApi();
    mockWitApi = createMockWitApi();
    mockClient = createMockAdoClientFull({
      coreApi: mockCoreApi,
      workApi: mockWorkApi,
      witApi: mockWitApi,
    });
  });

  describe("listTeams", () => {
    it("should list teams in a project", async () => {
      mockCoreApi.getTeams.mockResolvedValue([mockTeam]);

      const result = await listTeams(mockClient as unknown as AdoClient, {});

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe("team-123");
      expect(result[0].name).toBe("Test Team");
      expect(result[0].description).toBe("A test team");
    });

    it("should use specified project", async () => {
      mockCoreApi.getTeams.mockResolvedValue([mockTeam]);

      await listTeams(mockClient as unknown as AdoClient, {
        project: "CustomProject",
      });

      expect(mockCoreApi.getTeams).toHaveBeenCalledWith("CustomProject");
    });

    it("should use default project when not specified", async () => {
      mockCoreApi.getTeams.mockResolvedValue([mockTeam]);

      await listTeams(mockClient as unknown as AdoClient, {});

      expect(mockCoreApi.getTeams).toHaveBeenCalledWith("TestProject");
    });

    it("should return empty array when no teams found", async () => {
      mockCoreApi.getTeams.mockResolvedValue(null);

      const result = await listTeams(mockClient as unknown as AdoClient, {});

      expect(result).toEqual([]);
    });
  });

  describe("getTeamMembers", () => {
    it("should get team members", async () => {
      mockCoreApi.getTeamMembersWithExtendedProperties.mockResolvedValue([
        mockTeamMember,
      ]);

      const result = await getTeamMembers(mockClient as unknown as AdoClient, {
        team: "Test Team",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe("user-123-guid");
      expect(result[0].displayName).toBe("Test User");
    });

    it("should call API with correct parameters", async () => {
      mockCoreApi.getTeamMembersWithExtendedProperties.mockResolvedValue([]);

      await getTeamMembers(mockClient as unknown as AdoClient, {
        project: "MyProject",
        team: "DevTeam",
      });

      expect(
        mockCoreApi.getTeamMembersWithExtendedProperties
      ).toHaveBeenCalledWith("MyProject", "DevTeam");
    });

    it("should validate required team parameter", async () => {
      await expect(
        getTeamMembers(mockClient as unknown as AdoClient, {} as any)
      ).rejects.toThrow();
    });

    it("should return empty array when no members found", async () => {
      mockCoreApi.getTeamMembersWithExtendedProperties.mockResolvedValue(null);

      const result = await getTeamMembers(mockClient as unknown as AdoClient, {
        team: "EmptyTeam",
      });

      expect(result).toEqual([]);
    });
  });

  describe("listIterations", () => {
    it("should list iterations for a project", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([mockIteration]);

      const result = await listIterations(mockClient as unknown as AdoClient, {} as any);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe("iteration-1");
      expect(result[0].name).toBe("Sprint 1");
      expect(result[0].path).toBe("TestProject\\Sprint 1");
    });

    it("should filter by timeframe", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([mockIteration]);

      await listIterations(mockClient as unknown as AdoClient, {
        timeframe: "current",
      });

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalledWith(
        expect.objectContaining({ project: "TestProject" }),
        "current"
      );
    });

    it("should not pass timeframe for 'all'", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([mockIteration]);

      await listIterations(mockClient as unknown as AdoClient, {
        timeframe: "all",
      });

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalledWith(
        expect.objectContaining({ project: "TestProject" }),
        undefined
      );
    });

    it("should include team context when specified", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([]);

      await listIterations(mockClient as unknown as AdoClient, {
        team: "DevTeam",
        timeframe: "all",
      });

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalledWith(
        expect.objectContaining({ project: "TestProject", team: "DevTeam" }),
        undefined
      );
    });

    it("should return empty array when no iterations found", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue(null);

      const result = await listIterations(mockClient as unknown as AdoClient, {} as any);

      expect(result).toEqual([]);
    });

    it("should map iteration state correctly", async () => {
      const pastIteration = {
        ...mockIteration,
        attributes: { ...mockIteration.attributes, timeFrame: 0 },
      };
      mockWorkApi.getTeamIterations.mockResolvedValue([pastIteration]);

      const result = await listIterations(mockClient as unknown as AdoClient, {} as any);

      expect(result[0].state).toBe("past");
    });
  });

  describe("getCurrentIteration", () => {
    it("should get current iteration", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([mockIteration]);

      const result = await getCurrentIteration(
        mockClient as unknown as AdoClient,
        {}
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe("iteration-1");
      expect(result!.name).toBe("Sprint 1");
      expect(result!.state).toBe("current");
    });

    it("should call API with 'current' timeframe", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([mockIteration]);

      await getCurrentIteration(mockClient as unknown as AdoClient, {});

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalledWith(
        expect.objectContaining({ project: "TestProject" }),
        "current"
      );
    });

    it("should return null when no current iteration", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([]);

      const result = await getCurrentIteration(
        mockClient as unknown as AdoClient,
        {}
      );

      expect(result).toBeNull();
    });

    it("should use specified team", async () => {
      mockWorkApi.getTeamIterations.mockResolvedValue([mockIteration]);

      await getCurrentIteration(mockClient as unknown as AdoClient, {
        team: "MyTeam",
      });

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalledWith(
        expect.objectContaining({ team: "MyTeam" }),
        "current"
      );
    });

    it("should return first iteration when multiple found", async () => {
      const secondIteration = {
        ...mockIteration,
        id: "iteration-2",
        name: "Sprint 2",
      };
      mockWorkApi.getTeamIterations.mockResolvedValue([
        mockIteration,
        secondIteration,
      ]);

      const result = await getCurrentIteration(
        mockClient as unknown as AdoClient,
        {}
      );

      expect(result!.id).toBe("iteration-1");
    });
  });

  describe("listAreaPaths", () => {
    it("should list area paths for a project", async () => {
      mockWitApi.getClassificationNode.mockResolvedValue(mockAreaPath);

      const result = await listAreaPaths(mockClient as unknown as AdoClient, {} as any);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe("Area 1");
      expect(result[0].hasChildren).toBe(true);
    });

    it("should call API with correct parameters", async () => {
      mockWitApi.getClassificationNode.mockResolvedValue(mockAreaPath);

      await listAreaPaths(mockClient as unknown as AdoClient, {
        depth: 5,
      });

      expect(mockWitApi.getClassificationNode).toHaveBeenCalledWith(
        "TestProject",
        0, // TreeStructureGroup.Areas
        undefined,
        5
      );
    });

    it("should use default depth of 3", async () => {
      mockWitApi.getClassificationNode.mockResolvedValue(mockAreaPath);

      await listAreaPaths(mockClient as unknown as AdoClient, {} as any);

      expect(mockWitApi.getClassificationNode).toHaveBeenCalledWith(
        "TestProject",
        0,
        undefined,
        3
      );
    });

    it("should return empty array when no area paths found", async () => {
      mockWitApi.getClassificationNode.mockResolvedValue(null);

      const result = await listAreaPaths(mockClient as unknown as AdoClient, {} as any);

      expect(result).toEqual([]);
    });

    it("should handle nested children", async () => {
      const nestedAreaPath = {
        ...mockAreaPath,
        children: [
          {
            id: 2,
            name: "Sub Area",
            path: "TestProject\\Area 1\\Sub Area",
            hasChildren: false,
          },
        ],
      };
      mockWitApi.getClassificationNode.mockResolvedValue(nestedAreaPath);

      const result = await listAreaPaths(mockClient as unknown as AdoClient, {} as any);

      expect(result[0].children).toBeDefined();
      expect(result[0].children![0].name).toBe("Sub Area");
    });
  });
});
