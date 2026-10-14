import api from "../base/api";

import type {
  AdminLoginResponse,
  AdminSummary,
  LoginPayload,
  Permission,
  PermissionAction,
} from "./auth.types";

const TOKEN_KEY = "adminToken";
const EMAIL_KEY = "adminEmail";
const SESSION_KEY = "adminSession";

// Components reading the session through
// useAdminSession re-render when it
// changes.
const listeners = new Set<() => void>();

const notify = () =>
  listeners.forEach((listener) => listener());

export function subscribeAdminSession(
  listener: () => void
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

// ========================================
// LOGIN
//
// POST /api/auth/login
//
// Any account with an admin panel role
// can sign in.
// ========================================

export async function loginAdmin(
  data: LoginPayload
) {
  const response =
    await api.post<AdminLoginResponse>(
      "/api/auth/login",
      data
    );

  if (!response.data.token) {
    throw new Error(
      "No token returned from server"
    );
  }

  localStorage.setItem(
    TOKEN_KEY,
    response.data.token
  );

  saveSession(response.data.admin);

  return response.data;
}

export function logoutAdmin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(SESSION_KEY);

  notify();
}

export function isAdminLoggedIn() {
  return Boolean(
    localStorage.getItem(TOKEN_KEY)
  );
}

// ========================================
// SESSION
//
// Who is signed in, with their role and
// permissions. Null for a session saved
// before roles existed, until
// refreshAdminSession fills it in.
// ========================================

function saveSession(admin: AdminSummary) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(admin)
  );

  localStorage.setItem(
    EMAIL_KEY,
    admin.email
  );

  notify();
}

// Parsed once per change, so every read
// between changes returns the same object
// (useSyncExternalStore needs that).
let cachedRaw: string | null = null;
let cachedSession: AdminSummary | null =
  null;

export function getAdminSession(): AdminSummary | null {
  const raw =
    localStorage.getItem(SESSION_KEY);

  if (raw === cachedRaw) {
    return cachedSession;
  }

  cachedRaw = raw;

  try {
    cachedSession = raw
      ? (JSON.parse(raw) as AdminSummary)
      : null;
  } catch {
    cachedSession = null;
  }

  return cachedSession;
}

export function hasPermission(
  permission: Permission
) {
  return (
    getAdminSession()?.permissions.includes(
      permission
    ) ?? false
  );
}

// can("blogs", "delete") reads better at
// a call site than the raw string.
export function can(
  resource: string,
  action: PermissionAction
) {
  return hasPermission(
    `${resource}.${action}`
  );
}

// ========================================
// REFRESH SESSION
//
// GET /api/auth/me
//
// Picks up a role or permissions another
// admin changed since this login. Throws
// on 401, e.g. when the account was
// deleted.
// ========================================

export async function refreshAdminSession(): Promise<AdminSummary> {
  const response = await api.get<{
    admin: AdminSummary;
  }>("/api/auth/me");

  saveSession(response.data.admin);

  return response.data.admin;
}
