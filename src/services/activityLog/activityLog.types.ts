// ========================================
// ACTIVITY LOG TYPES
//
// The audit trail the API writes on its
// own: every create, update and delete
// made in this panel, and every login.
// Read-only.
// ========================================

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "login_failed";

export type ActivityLog = {
  _id: string;

  // Null for a failed login.
  actor: string | null;

  // As they were at the time.
  actorName: string;
  actorEmail: string;
  actorRole: string;

  action: ActivityAction;

  // A permission resource key, e.g.
  // "blogs", or "auth" for logins.
  resource: string;

  targetId: string | null;

  // The record's name or title at the
  // time, e.g. a blog's title.
  targetLabel: string | null;

  method: string;
  path: string;
  statusCode: number;

  // The submitted form, with passwords
  // hidden and long text shortened. Null
  // for deletes and logins.
  details: unknown;

  ip: string | null;
  userAgent: string | null;

  createdAt: string;
};

export type ActivityLogPage = {
  items: ActivityLog[];
  total: number;
  page: number;
  pages: number;
};

export type ActivityLogQuery = {
  page: number;
  limit: number;
  search: string;
  actor: string;
  resource: string;
  action: string;
  // yyyy-mm-dd, inclusive. Blank means
  // no limit.
  from: string;
  to: string;
};

export type ActivityLogFilters = {
  actors: {
    id: string;
    name: string;
    email: string;
  }[];

  resources: {
    key: string;
    label: string;
  }[];

  actions: ActivityAction[];
};
