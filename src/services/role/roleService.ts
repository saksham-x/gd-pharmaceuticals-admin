import api from "../base/api";

import type {
  PermissionCatalog,
  Role,
  RolePayload,
} from "./role.types";

// ========================================
// API CONFIGURATION
//
// Reading needs roles.view or
// adminUsers.view (the Admin Users page
// lists roles in its role picker).
// Writing needs roles.create / update /
// delete.
// ========================================

const ROLE_API = "/api/roles";

// ========================================
// GET ALL ROLES
//
// GET /api/roles
//
// Built-in roles first.
// ========================================

export const getRoles =
  async (): Promise<Role[]> => {
    const response =
      await api.get<Role[]>(ROLE_API);

    return response.data;
  };

// ========================================
// GET PERMISSION CATALOG
//
// GET /api/roles/permissions
// ========================================

export const getPermissionCatalog =
  async (): Promise<PermissionCatalog> => {
    const response =
      await api.get<PermissionCatalog>(
        `${ROLE_API}/permissions`
      );

    return response.data;
  };

// ========================================
// CREATE ROLE
//
// POST /api/roles
//
// 409 when a role with that name exists;
// 403 when granting a permission you do
// not hold yourself.
// ========================================

export const createRole = async (
  data: RolePayload
): Promise<Role> => {
  const response = await api.post<Role>(
    ROLE_API,
    data
  );

  return response.data;
};

// ========================================
// UPDATE ROLE
//
// PUT /api/roles/:id
//
// Refused for Super Admin, and for your
// own role unless you are a super admin.
// ========================================

export const updateRole = async (
  id: string,
  data: RolePayload
): Promise<Role> => {
  const response = await api.put<Role>(
    `${ROLE_API}/${id}`,
    data
  );

  return response.data;
};

// ========================================
// DELETE ROLE
//
// DELETE /api/roles/:id
//
// Refused for built-in roles and for a
// role someone still holds.
// ========================================

export const deleteRole = async (
  id: string
): Promise<void> => {
  await api.delete(`${ROLE_API}/${id}`);
};
