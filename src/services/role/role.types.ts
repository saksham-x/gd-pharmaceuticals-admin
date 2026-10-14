import type {
  Permission,
  PermissionAction,
} from "../auth/auth.types";

// ========================================
// ROLE TYPES
//
// A role groups permissions; every admin
// user holds exactly one. Super Admin is
// locked and always has everything.
// ========================================

export type Role = {
  _id: string;

  // Stored on users, e.g. "front_desk".
  // Set from the name on creation and
  // never changes.
  key: string;

  name: string;

  description: string;

  permissions: Permission[];

  // super_admin, admin, staff: cannot be
  // deleted.
  isSystem: boolean;

  // super_admin: read-only.
  locked: boolean;

  // Admin users holding this role.
  userCount: number;

  createdAt?: string;

  updatedAt?: string;
};

export type RolePayload = {
  name: string;

  description: string;

  permissions: Permission[];
};

// ========================================
// PERMISSION CATALOG
//
// GET /api/roles/permissions — every page
// that can be granted, with the actions it
// actually has (website content has no
// "create": it is one document).
// ========================================

export type PermissionResource = {
  key: string;

  label: string;

  // Heading the Roles page groups rows
  // under, e.g. "CMS".
  group: string;

  actions: PermissionAction[];
};

export type PermissionCatalog = {
  actions: PermissionAction[];

  resources: PermissionResource[];
};
