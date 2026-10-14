// ========================================
// AUTH TYPES
// ========================================

export type LoginPayload = {
  email: string;
  password: string;
};

// `<resource>.<action>`, e.g.
// "enquiries.update". The list lives on
// the backend (role.permissions.ts) and
// reaches the panel through
// GET /api/roles/permissions. The API
// enforces these; the panel only uses
// them to hide what an account cannot
// use.
export type Permission = string;

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete";

// A role key: "super_admin", "admin",
// "staff", or one made on the Roles page.
export type AdminRole = string;

export const SUPER_ADMIN_ROLE = "super_admin";

// ========================================
// ADMIN SESSION
//
// Returned by POST /api/auth/login and
// GET /api/auth/me, kept in localStorage.
// ========================================

export type AdminSummary = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  // Display name, e.g. "Super Admin".
  // Missing from sessions saved before
  // roles moved to the database.
  roleName?: string;
  permissions: Permission[];
};

export type AdminLoginResponse = {
  message: string;
  token: string;
  admin: AdminSummary;
};
