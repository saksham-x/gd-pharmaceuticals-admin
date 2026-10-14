import api from "../base/api";

import type {
  ActivityLogFilters,
  ActivityLogPage,
  ActivityLogQuery,
} from "./activityLog.types";

// ========================================
// API CONFIGURATION
//
// Both routes need activityLogs.view.
// There is no write route: the API
// records entries by itself.
// ========================================

const ACTIVITY_LOG_API = "/api/activity-logs";

// ========================================
// GET ONE PAGE OF LOGS
//
// GET /api/activity-logs
//
// Newest first. Blank filters are sent as
// "" and ignored by the API.
// ========================================

export const getActivityLogs = async (
  query: ActivityLogQuery
): Promise<ActivityLogPage> => {
  const response =
    await api.get<ActivityLogPage>(
      ACTIVITY_LOG_API,
      { params: query }
    );

  return response.data;
};

// ========================================
// GET FILTER OPTIONS
//
// GET /api/activity-logs/filters
//
// The admins who appear in the log, and
// the pages and actions to filter by.
// ========================================

export const getActivityLogFilters =
  async (): Promise<ActivityLogFilters> => {
    const response =
      await api.get<ActivityLogFilters>(
        `${ACTIVITY_LOG_API}/filters`
      );

    return response.data;
  };
