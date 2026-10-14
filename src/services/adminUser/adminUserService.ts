import api from "../base/api";

import type {
  AdminUser,
  AdminUserPayload,
  AdminUserUpdatePayload,
} from "./adminUser.types";

// ========================================
// API CONFIGURATION
//
// Each route needs the matching
// adminUsers.* permission. Only a super
// admin can create, change or delete a
// super admin.
// ========================================

const ADMIN_USER_API = "/api/admin-users";

// ========================================
// GET ALL ADMIN USERS
//
// GET /api/admin-users
//
// Newest first.
// ========================================

export const getAdminUsers =
  async (): Promise<AdminUser[]> => {
    const response =
      await api.get<AdminUser[]>(
        ADMIN_USER_API
      );

    return response.data;
  };

// ========================================
// CREATE ADMIN USER
//
// POST /api/admin-users
//
// Answers 409 when the email already has
// an account.
// ========================================

export const createAdminUser = async (
  data: AdminUserPayload
): Promise<AdminUser> => {
  const response =
    await api.post<AdminUser>(
      ADMIN_USER_API,
      data
    );

  return response.data;
};

// ========================================
// UPDATE ADMIN USER
//
// PUT /api/admin-users/:id
//
// Refused for your own role and for
// demoting the last super admin.
// ========================================

export const updateAdminUser = async (
  id: string,
  data: AdminUserUpdatePayload
): Promise<AdminUser> => {
  const response =
    await api.put<AdminUser>(
      `${ADMIN_USER_API}/${id}`,
      data
    );

  return response.data;
};

// ========================================
// CHANGE PASSWORD
//
// PATCH /api/admin-users/:id/password
//
// Needs adminPasswords.update. Only a
// super admin can change a super admin's
// password.
// ========================================

export const changeAdminUserPassword =
  async (
    id: string,
    password: string
  ): Promise<void> => {
    await api.patch(
      `${ADMIN_USER_API}/${id}/password`,
      { password }
    );
  };

// ========================================
// DELETE ADMIN USER
//
// DELETE /api/admin-users/:id
//
// Refused for yourself and the last
// super admin.
// ========================================

export const deleteAdminUser = async (
  id: string
): Promise<void> => {
  await api.delete(
    `${ADMIN_USER_API}/${id}`
  );
};
