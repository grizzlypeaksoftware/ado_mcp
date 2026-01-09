import { AdoClient } from "../../src/ado-client";
import * as azdev from "azure-devops-node-api";

// Mock the azure-devops-node-api module
jest.mock("azure-devops-node-api");

const mockWebApi = {
  connect: jest.fn(),
  getCoreApi: jest.fn(),
  getWorkItemTrackingApi: jest.fn(),
  getGitApi: jest.fn(),
};

const MockWebApi = azdev.WebApi as jest.MockedClass<typeof azdev.WebApi>;
const mockGetPatHandler = azdev.getPersonalAccessTokenHandler as jest.MockedFunction<
  typeof azdev.getPersonalAccessTokenHandler
>;

beforeEach(() => {
  jest.clearAllMocks();
  MockWebApi.mockImplementation(() => mockWebApi as unknown as azdev.WebApi);
  mockGetPatHandler.mockReturnValue({} as ReturnType<typeof azdev.getPersonalAccessTokenHandler>);
});

describe("AdoClient", () => {
  const orgUrl = "https://dev.azure.com/testorg";
  const pat = "test-pat-token";
  const defaultProject = "TestProject";

  describe("constructor", () => {
    it("should create a client with required parameters", () => {
      const client = new AdoClient(orgUrl, pat);

      expect(mockGetPatHandler).toHaveBeenCalledWith(pat);
      expect(MockWebApi).toHaveBeenCalledWith(orgUrl, expect.anything());
      expect(client.getOrgUrl()).toBe(orgUrl);
      expect(client.getDefaultProject()).toBeUndefined();
    });

    it("should create a client with optional default project", () => {
      const client = new AdoClient(orgUrl, pat, defaultProject);

      expect(client.getDefaultProject()).toBe(defaultProject);
    });
  });

  describe("resolveProject", () => {
    it("should return provided project when given", () => {
      const client = new AdoClient(orgUrl, pat, defaultProject);

      expect(client.resolveProject("OtherProject")).toBe("OtherProject");
    });

    it("should return default project when no project provided", () => {
      const client = new AdoClient(orgUrl, pat, defaultProject);

      expect(client.resolveProject()).toBe(defaultProject);
    });

    it("should throw error when no project provided and no default", () => {
      const client = new AdoClient(orgUrl, pat);

      expect(() => client.resolveProject()).toThrow(
        "Project is required. Provide a project parameter or set ADO_PROJECT environment variable."
      );
    });
  });

  describe("validateConnection", () => {
    it("should succeed when authentication is valid", async () => {
      const client = new AdoClient(orgUrl, pat);
      mockWebApi.connect.mockResolvedValue({
        authenticatedUser: { id: "user-123", customDisplayName: "Test User" },
      });

      await expect(client.validateConnection()).resolves.toBeUndefined();
      expect(mockWebApi.connect).toHaveBeenCalled();
    });

    it("should throw error when no authenticated user", async () => {
      const client = new AdoClient(orgUrl, pat);
      mockWebApi.connect.mockResolvedValue({});

      await expect(client.validateConnection()).rejects.toThrow(
        "Failed to authenticate with Azure DevOps"
      );
    });

    it("should throw error with message on connection failure", async () => {
      const client = new AdoClient(orgUrl, pat);
      mockWebApi.connect.mockRejectedValue(new Error("Network error"));

      await expect(client.validateConnection()).rejects.toThrow(
        "Failed to connect to Azure DevOps: Network error"
      );
    });
  });

  describe("getConnectionData", () => {
    it("should return connection data", async () => {
      const client = new AdoClient(orgUrl, pat);
      const connectionData = {
        authenticatedUser: { id: "user-123" },
        authorizedUser: { id: "user-123" },
      };
      mockWebApi.connect.mockResolvedValue(connectionData);

      const result = await client.getConnectionData();

      expect(result).toEqual(connectionData);
    });
  });

  describe("API client getters", () => {
    it("should get Core API and cache it", async () => {
      const client = new AdoClient(orgUrl, pat);
      const mockCoreApi = { getProjects: jest.fn() };
      mockWebApi.getCoreApi.mockResolvedValue(mockCoreApi);

      const api1 = await client.getCoreApi();
      const api2 = await client.getCoreApi();

      expect(api1).toBe(mockCoreApi);
      expect(api2).toBe(mockCoreApi);
      expect(mockWebApi.getCoreApi).toHaveBeenCalledTimes(1);
    });

    it("should get Work Item Tracking API and cache it", async () => {
      const client = new AdoClient(orgUrl, pat);
      const mockWitApi = { getWorkItem: jest.fn() };
      mockWebApi.getWorkItemTrackingApi.mockResolvedValue(mockWitApi);

      const api1 = await client.getWorkItemTrackingApi();
      const api2 = await client.getWorkItemTrackingApi();

      expect(api1).toBe(mockWitApi);
      expect(api2).toBe(mockWitApi);
      expect(mockWebApi.getWorkItemTrackingApi).toHaveBeenCalledTimes(1);
    });

    it("should get Git API and cache it", async () => {
      const client = new AdoClient(orgUrl, pat);
      const mockGitApi = { getRepositories: jest.fn() };
      mockWebApi.getGitApi.mockResolvedValue(mockGitApi);

      const api1 = await client.getGitApi();
      const api2 = await client.getGitApi();

      expect(api1).toBe(mockGitApi);
      expect(api2).toBe(mockGitApi);
      expect(mockWebApi.getGitApi).toHaveBeenCalledTimes(1);
    });
  });
});
