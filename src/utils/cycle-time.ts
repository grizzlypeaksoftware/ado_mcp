import { AdoClient } from "../ado-client.js";

/**
 * Result of cycle time calculation
 */
export interface CycleTimeInfo {
  /** Date when work item was first moved to Active state */
  firstActivatedDate?: string;
  /** Cycle time in days (only set if work item is closed) */
  cycleTimeDays?: number;
}

/**
 * Common "active" states across different Azure DevOps process templates.
 * - Agile: Active
 * - Scrum: Committed, In Progress
 * - CMMI: Active
 * - Basic: Doing
 */
const ACTIVE_STATES = new Set([
  "Active",
  "Committed",
  "In Progress",
  "Doing",
]);

/**
 * Closed/completed states across different process templates.
 */
const CLOSED_STATES = new Set([
  "Closed",
  "Done",
  "Completed",
  "Resolved",
  "Removed",
]);

/**
 * Fetches work item revision history and finds the first time
 * the work item was moved to an "active" state.
 *
 * @param client - Azure DevOps client
 * @param workItemId - Work item ID to check
 * @param closedDate - Optional closed date for cycle time calculation
 * @returns CycleTimeInfo with firstActivatedDate and optional cycleTimeDays
 */
export async function getCycleTimeInfo(
  client: AdoClient,
  workItemId: number,
  closedDate?: Date | string
): Promise<CycleTimeInfo> {
  const witApi = await client.getWorkItemTrackingApi();

  try {
    // Get all updates (revision history) for the work item
    const updates = await witApi.getUpdates(workItemId);

    if (!updates || updates.length === 0) {
      return {};
    }

    // Find the first update where State changed to an "active" state
    let firstActivatedDate: Date | undefined;

    for (const update of updates) {
      const stateChange = update.fields?.["System.State"];

      if (stateChange && stateChange.newValue) {
        const newState = String(stateChange.newValue);

        // Check if this is the first transition to an active state
        if (ACTIVE_STATES.has(newState)) {
          firstActivatedDate = update.revisedDate;
          break; // We only want the first activation
        }
      }
    }

    if (!firstActivatedDate) {
      return {};
    }

    const result: CycleTimeInfo = {
      firstActivatedDate: firstActivatedDate.toISOString(),
    };

    // Calculate cycle time if we have a closed date
    if (closedDate) {
      const closed = typeof closedDate === "string" ? new Date(closedDate) : closedDate;
      const cycleTimeMs = closed.getTime() - firstActivatedDate.getTime();
      const cycleTimeDays = Math.round((cycleTimeMs / (1000 * 60 * 60 * 24)) * 10) / 10; // Round to 1 decimal

      if (cycleTimeDays >= 0) {
        result.cycleTimeDays = cycleTimeDays;
      }
    }

    return result;
  } catch {
    // If we can't get updates (permission issue, etc.), return empty
    return {};
  }
}

/**
 * Check if a state is considered "closed" for cycle time purposes.
 */
export function isClosedState(state: string): boolean {
  return CLOSED_STATES.has(state);
}

/**
 * Get cycle time info for multiple work items efficiently.
 * Note: This makes one API call per work item, so use sparingly for large lists.
 *
 * @param client - Azure DevOps client
 * @param workItems - Array of work items with id, state, and optional closedDate
 * @returns Map of work item ID to CycleTimeInfo
 */
export async function getCycleTimeInfoBatch(
  client: AdoClient,
  workItems: Array<{ id: number; state: string; closedDate?: Date | string }>
): Promise<Map<number, CycleTimeInfo>> {
  const results = new Map<number, CycleTimeInfo>();

  // Process in parallel with concurrency limit to avoid overwhelming the API
  const BATCH_SIZE = 10;

  for (let i = 0; i < workItems.length; i += BATCH_SIZE) {
    const batch = workItems.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (wi) => {
      const closedDate = isClosedState(wi.state) ? wi.closedDate : undefined;
      const info = await getCycleTimeInfo(client, wi.id, closedDate);
      return { id: wi.id, info };
    });

    const batchResults = await Promise.all(promises);
    for (const { id, info } of batchResults) {
      results.set(id, info);
    }
  }

  return results;
}
