import { getCycleTimeInfo, isClosedState, getCycleTimeInfoBatch } from "../../../src/utils/cycle-time";
import { AdoClient } from "../../../src/ado-client";

// Mock the AdoClient
jest.mock("../../../src/ado-client");

describe("cycle-time utility", () => {
  let mockClient: jest.Mocked<AdoClient>;
  let mockWitApi: {
    getUpdates: jest.Mock;
  };

  beforeEach(() => {
    mockWitApi = {
      getUpdates: jest.fn(),
    };

    mockClient = {
      getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWitApi),
    } as unknown as jest.Mocked<AdoClient>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("isClosedState", () => {
    it("should return true for Closed state", () => {
      expect(isClosedState("Closed")).toBe(true);
    });

    it("should return true for Done state", () => {
      expect(isClosedState("Done")).toBe(true);
    });

    it("should return true for Completed state", () => {
      expect(isClosedState("Completed")).toBe(true);
    });

    it("should return true for Resolved state", () => {
      expect(isClosedState("Resolved")).toBe(true);
    });

    it("should return true for Removed state", () => {
      expect(isClosedState("Removed")).toBe(true);
    });

    it("should return false for Active state", () => {
      expect(isClosedState("Active")).toBe(false);
    });

    it("should return false for New state", () => {
      expect(isClosedState("New")).toBe(false);
    });

    it("should return false for In Progress state", () => {
      expect(isClosedState("In Progress")).toBe(false);
    });
  });

  describe("getCycleTimeInfo", () => {
    it("should return empty object when no updates exist", async () => {
      mockWitApi.getUpdates.mockResolvedValue([]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result).toEqual({});
      expect(mockWitApi.getUpdates).toHaveBeenCalledWith(123);
    });

    it("should return empty object when updates is null", async () => {
      mockWitApi.getUpdates.mockResolvedValue(null);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result).toEqual({});
    });

    it("should find first activated date when state changes to Active", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");
      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: new Date("2024-01-10T08:00:00Z"),
          fields: {
            "System.State": { oldValue: undefined, newValue: "New" },
          },
        },
        {
          id: 2,
          revisedDate: activatedDate,
          fields: {
            "System.State": { oldValue: "New", newValue: "Active" },
          },
        },
        {
          id: 3,
          revisedDate: new Date("2024-01-20T14:00:00Z"),
          fields: {
            "System.State": { oldValue: "Active", newValue: "Closed" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result.firstActivatedDate).toBe(activatedDate.toISOString());
      expect(result.cycleTimeDays).toBeUndefined();
    });

    it("should find first activated date for Committed state (Scrum)", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");
      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: {
            "System.State": { oldValue: "New", newValue: "Committed" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result.firstActivatedDate).toBe(activatedDate.toISOString());
    });

    it("should find first activated date for In Progress state", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");
      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: {
            "System.State": { oldValue: "New", newValue: "In Progress" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result.firstActivatedDate).toBe(activatedDate.toISOString());
    });

    it("should find first activated date for Doing state (Basic)", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");
      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: {
            "System.State": { oldValue: "To Do", newValue: "Doing" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result.firstActivatedDate).toBe(activatedDate.toISOString());
    });

    it("should calculate cycle time when closed date is provided", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");
      const closedDate = new Date("2024-01-20T10:00:00Z"); // 5 days later

      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: {
            "System.State": { oldValue: "New", newValue: "Active" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123, closedDate);

      expect(result.firstActivatedDate).toBe(activatedDate.toISOString());
      expect(result.cycleTimeDays).toBe(5);
    });

    it("should calculate cycle time with string closed date", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");
      const closedDateStr = "2024-01-18T10:00:00Z"; // 3 days later

      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: {
            "System.State": { oldValue: "New", newValue: "Active" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123, closedDateStr);

      expect(result.firstActivatedDate).toBe(activatedDate.toISOString());
      expect(result.cycleTimeDays).toBe(3);
    });

    it("should round cycle time to 1 decimal place", async () => {
      const activatedDate = new Date("2024-01-15T00:00:00Z");
      const closedDate = new Date("2024-01-17T12:00:00Z"); // 2.5 days later

      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: {
            "System.State": { oldValue: "New", newValue: "Active" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123, closedDate);

      expect(result.cycleTimeDays).toBe(2.5);
    });

    it("should return only first activation even if reactivated", async () => {
      const firstActivatedDate = new Date("2024-01-15T10:00:00Z");
      const secondActivatedDate = new Date("2024-01-25T10:00:00Z");

      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: firstActivatedDate,
          fields: {
            "System.State": { oldValue: "New", newValue: "Active" },
          },
        },
        {
          id: 2,
          revisedDate: new Date("2024-01-20T10:00:00Z"),
          fields: {
            "System.State": { oldValue: "Active", newValue: "Resolved" },
          },
        },
        {
          id: 3,
          revisedDate: secondActivatedDate,
          fields: {
            "System.State": { oldValue: "Resolved", newValue: "Active" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result.firstActivatedDate).toBe(firstActivatedDate.toISOString());
    });

    it("should return empty object when API call fails", async () => {
      mockWitApi.getUpdates.mockRejectedValue(new Error("API Error"));

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result).toEqual({});
    });

    it("should return empty object when work item was never activated", async () => {
      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: new Date("2024-01-10T08:00:00Z"),
          fields: {
            "System.Title": { oldValue: undefined, newValue: "New work item" },
          },
        },
        {
          id: 2,
          revisedDate: new Date("2024-01-11T08:00:00Z"),
          fields: {
            "System.Description": { oldValue: undefined, newValue: "Description" },
          },
        },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result).toEqual({});
    });

    it("should handle updates without fields property", async () => {
      mockWitApi.getUpdates.mockResolvedValue([
        { id: 1, revisedDate: new Date() },
        { id: 2, revisedDate: new Date() },
      ]);

      const result = await getCycleTimeInfo(mockClient, 123);

      expect(result).toEqual({});
    });
  });

  describe("getCycleTimeInfoBatch", () => {
    it("should return empty map for empty input", async () => {
      const result = await getCycleTimeInfoBatch(mockClient, []);

      expect(result.size).toBe(0);
    });

    it("should process multiple work items", async () => {
      const date1 = new Date("2024-01-15T10:00:00Z");
      const date2 = new Date("2024-01-16T10:00:00Z");

      mockWitApi.getUpdates
        .mockResolvedValueOnce([
          {
            id: 1,
            revisedDate: date1,
            fields: { "System.State": { newValue: "Active" } },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 1,
            revisedDate: date2,
            fields: { "System.State": { newValue: "Active" } },
          },
        ]);

      const result = await getCycleTimeInfoBatch(mockClient, [
        { id: 100, state: "Active" },
        { id: 200, state: "Active" },
      ]);

      expect(result.size).toBe(2);
      expect(result.get(100)?.firstActivatedDate).toBe(date1.toISOString());
      expect(result.get(200)?.firstActivatedDate).toBe(date2.toISOString());
    });

    it("should handle closed work items with cycle time calculation", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");
      const closedDate = new Date("2024-01-20T10:00:00Z");

      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: { "System.State": { newValue: "Active" } },
        },
      ]);

      const result = await getCycleTimeInfoBatch(mockClient, [
        { id: 100, state: "Closed", closedDate },
      ]);

      expect(result.get(100)?.firstActivatedDate).toBe(activatedDate.toISOString());
      expect(result.get(100)?.cycleTimeDays).toBe(5);
    });

    it("should not calculate cycle time for non-closed work items", async () => {
      const activatedDate = new Date("2024-01-15T10:00:00Z");

      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: activatedDate,
          fields: { "System.State": { newValue: "Active" } },
        },
      ]);

      const result = await getCycleTimeInfoBatch(mockClient, [
        { id: 100, state: "Active", closedDate: new Date() }, // closedDate should be ignored
      ]);

      expect(result.get(100)?.firstActivatedDate).toBe(activatedDate.toISOString());
      expect(result.get(100)?.cycleTimeDays).toBeUndefined();
    });

    it("should process work items in batches of 10", async () => {
      // Create 25 work items
      const workItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        state: "Active",
      }));

      mockWitApi.getUpdates.mockResolvedValue([
        {
          id: 1,
          revisedDate: new Date(),
          fields: { "System.State": { newValue: "Active" } },
        },
      ]);

      await getCycleTimeInfoBatch(mockClient, workItems);

      // Should be called 25 times (once per work item)
      expect(mockWitApi.getUpdates).toHaveBeenCalledTimes(25);
    });
  });
});
