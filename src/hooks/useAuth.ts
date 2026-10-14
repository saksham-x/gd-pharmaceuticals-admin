import { useSyncExternalStore } from "react";

import {
  getAdminSession,
  subscribeAdminSession,
} from "../services/auth/authService";

import type {
  AdminSummary,
  PermissionAction,
} from "../services/auth/auth.types";

// ========================================
// SESSION HOOKS
//
// The signed-in account, kept current:
// a component re-renders when the session
// refreshes with new permissions.
// ========================================

export function useAdminSession(): AdminSummary | null {
  return useSyncExternalStore(
    subscribeAdminSession,
    getAdminSession
  );
}

// What the signed-in account may do with
// one resource:
//
//   const allowed = usePermissions("blogs");
//   {allowed.create && <button>Add</button>}
export function usePermissions(
  resource: string
): Record<PermissionAction, boolean> {
  const permissions =
    useAdminSession()?.permissions ?? [];

  const has = (action: PermissionAction) =>
    permissions.includes(
      `${resource}.${action}`
    );

  return {
    view: has("view"),
    create: has("create"),
    update: has("update"),
    delete: has("delete"),
  };
}
