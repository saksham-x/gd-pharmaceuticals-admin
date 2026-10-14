import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import DialogBox from "../../components/DialogBox";

import FormField from "../../components/FormField";

import LoadingSpinner from "../../components/LoadingSpinner";

import RowActionsMenu from "../../components/RowActionsMenu";

import {
  useAdminSession,
  usePermissions,
} from "../../hooks/useAuth";

import { refreshAdminSession } from "../../services/auth/authService";

import {
  SUPER_ADMIN_ROLE,
  type Permission,
  type PermissionAction,
} from "../../services/auth/auth.types";

import { getApiErrorMessage } from "../../services/base/api";

import {
  createRole,
  deleteRole,
  getPermissionCatalog,
  getRoles,
  updateRole,
} from "../../services/role/roleService";

import type {
  PermissionCatalog,
  PermissionResource,
  Role,
  RolePayload,
} from "../../services/role/role.types";

import {
  maxLength,
  required,
  validate,
} from "../../utils/validation";

// ========================================
// FORM DEFAULTS
// ========================================

const EMPTY_FORM: RolePayload = {
  name: "",
  description: "",
  permissions: [],
};

const ACTION_LABELS: Record<
  PermissionAction,
  string
> = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

// ========================================
// SHARED STYLES
// ========================================

const inputClass =
  "w-full rounded-xl border border-[#1266B1]/20 bg-soft px-4 py-3 text-sm outline-none focus:border-[#1266B1] disabled:cursor-not-allowed disabled:opacity-60";

const checkboxClass =
  "h-4 w-4 cursor-pointer accent-[#1266B1] disabled:cursor-not-allowed disabled:opacity-40";

const permissionOf = (
  resource: string,
  action: PermissionAction
): Permission => `${resource}.${action}`;

// Resources in catalog order, bucketed
// under their group heading.
const groupResources = (
  resources: PermissionResource[]
) => {
  const groups = new Map<
    string,
    PermissionResource[]
  >();

  resources.forEach((resource) => {
    groups.set(resource.group, [
      ...(groups.get(resource.group) ?? []),
      resource,
    ]);
  });

  return [...groups.entries()];
};

export default function RolesAdmin() {
  const session = useAdminSession();

  const allowed = usePermissions("roles");

  const isSuperAdmin =
    session?.role === SUPER_ADMIN_ROLE;

  const myPermissions =
    session?.permissions ?? [];

  const [roles, setRoles] = useState<
    Role[]
  >([]);

  const [catalog, setCatalog] =
    useState<PermissionCatalog | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [form, setForm] =
    useState<RolePayload>(EMPTY_FORM);

  // The role open in the dialog. Null
  // while adding a new one.
  const [openRole, setOpenRole] =
    useState<Role | null>(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [roleToDelete, setRoleToDelete] =
    useState<Role | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  // ============================
  // FETCH
  // ============================

  const fetchRoles = async () => {
    try {
      setLoading(true);

      const [roleList, permissionCatalog] =
        await Promise.all([
          getRoles(),
          getPermissionCatalog(),
        ]);

      setRoles(roleList);
      setCatalog(permissionCatalog);
    } catch (error) {
      console.error(
        "Fetch roles error:",
        error
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Failed to load roles"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // ============================
  // WHAT THIS ACCOUNT MAY CHANGE
  //
  // Mirrors the API's rules, so the
  // dialog never offers a change that
  // would be refused.
  // ============================

  const isOwnRole = (role: Role) =>
    role.key === session?.role;

  const canEdit = (role: Role) =>
    allowed.update &&
    !role.locked &&
    (isSuperAdmin || !isOwnRole(role));

  const canDelete = (role: Role) =>
    allowed.delete &&
    !role.isSystem &&
    role.userCount === 0;

  // Read-only when viewing a role this
  // account cannot change.
  const readOnly = openRole
    ? !canEdit(openRole)
    : !allowed.create;

  // Nobody grants what they do not hold.
  // Already-granted boxes stay usable so
  // they can still be removed.
  const canToggle = (
    permission: Permission
  ) =>
    !readOnly &&
    (isSuperAdmin ||
      myPermissions.includes(permission) ||
      form.permissions.includes(permission));

  // ============================
  // FORM
  // ============================

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setOpenRole(null);
    setFormOpen(true);
  };

  const openRoleForm = (role: Role) => {
    setForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });

    setOpenRole(role);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setOpenRole(null);
  };

  // Create, update and delete are useless
  // without view, so ticking one of them
  // ticks view, and unticking view clears
  // the rest of the row.
  const setChecked = (
    list: Permission[],
    resource: PermissionResource,
    action: PermissionAction,
    checked: boolean
  ): Permission[] => {
    const permission = permissionOf(
      resource.key,
      action
    );

    if (checked) {
      const withView =
        action !== "view" &&
        resource.actions.includes("view")
          ? [
              permission,
              permissionOf(
                resource.key,
                "view"
              ),
            ]
          : [permission];

      return [
        ...new Set([...list, ...withView]),
      ];
    }

    if (action === "view") {
      return list.filter(
        (item) =>
          !item.startsWith(
            `${resource.key}.`
          ) || !canToggle(item)
      );
    }

    return list.filter(
      (item) => item !== permission
    );
  };

  const togglePermission = (
    resource: PermissionResource,
    action: PermissionAction,
    checked: boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      permissions: setChecked(
        previous.permissions,
        resource,
        action,
        checked
      ),
    }));
  };

  // Every action this account may toggle
  // in one row, or one column.
  const toggleMany = (
    cells: [
      PermissionResource,
      PermissionAction,
    ][],
    checked: boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      permissions: cells
        .filter(([resource, action]) =>
          canToggle(
            permissionOf(resource.key, action)
          )
        )
        .reduce(
          (list, [resource, action]) =>
            setChecked(
              list,
              resource,
              action,
              checked
            ),
          previous.permissions
        ),
    }));
  };

  const rowCells = (
    resource: PermissionResource
  ): [PermissionResource, PermissionAction][] =>
    resource.actions.map((action) => [
      resource,
      action,
    ]);

  const columnCells = (
    action: PermissionAction
  ): [PermissionResource, PermissionAction][] =>
    (catalog?.resources ?? [])
      .filter((resource) =>
        resource.actions.includes(action)
      )
      .map((resource) => [resource, action]);

  const allChecked = (
    cells: [
      PermissionResource,
      PermissionAction,
    ][]
  ) =>
    cells.length > 0 &&
    cells.every(([resource, action]) =>
      form.permissions.includes(
        permissionOf(resource.key, action)
      )
    );

  // ============================
  // SAVE
  // ============================

  const handleSubmit = async () => {
    const error = validate(form, {
      name: ["Name", [required(), maxLength(60)]],
      description: [
        "Description",
        [maxLength(300)],
      ],
    });

    if (error) {
      toast.error(error);

      return;
    }

    const payload: RolePayload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    };

    try {
      setSaving(true);

      if (openRole) {
        await updateRole(
          openRole._id,
          payload
        );

        toast.success(
          "Role updated successfully!"
        );
      } else {
        await createRole(payload);

        toast.success(
          "Role added successfully!"
        );
      }

      closeForm();

      await fetchRoles();

      // The sidebar of anyone signed in
      // with this role changes on their
      // next load; refresh our own now in
      // case it is ours.
      refreshAdminSession().catch(() => {});
    } catch (error) {
      console.error(
        "Save role error:",
        error
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to save the role"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // DELETE
  // ============================

  const confirmDelete = async () => {
    if (!roleToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteRole(roleToDelete._id);

      toast.success(
        "Role deleted successfully!"
      );

      setRoleToDelete(null);

      await fetchRoles();
    } catch (error) {
      console.error(
        "Delete role error:",
        error
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to delete the role"
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  // ============================
  // ROLE CARD
  // ============================

  const totalPermissions =
    catalog?.resources.reduce(
      (sum, resource) =>
        sum + resource.actions.length,
      0
    ) ?? 0;

  const renderCard = (role: Role) => {
    const deleteBlockedReason =
      role.isSystem
        ? "Built-in roles cannot be deleted"
        : role.userCount > 0
          ? "Move its admin users to another role first"
          : null;

    return (
      <article
        key={role._id}
        className={`flex flex-col rounded-3xl bg-surface p-6 shadow-sm ${
          role.locked
            ? "ring-1 ring-[#1266B1]/40"
            : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl text-ink">
              {role.name}
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              {role.locked ? (
                <span className="rounded-full bg-[#1266B1] px-3 py-0.5 text-[11px] uppercase tracking-[1px] text-white">
                  Locked · all access
                </span>
              ) : role.isSystem ? (
                <span className="rounded-full bg-blush px-3 py-0.5 text-[11px] uppercase tracking-[1px] text-[#1266B1]">
                  Built-in
                </span>
              ) : (
                <span className="rounded-full bg-soft px-3 py-0.5 text-[11px] uppercase tracking-[1px] text-muted">
                  Custom
                </span>
              )}

              {isOwnRole(role) && (
                <span className="rounded-full bg-soft px-3 py-0.5 text-[11px] uppercase tracking-[1px] text-muted">
                  Your role
                </span>
              )}
            </div>
          </div>

          <RowActionsMenu
            label={`Actions for ${role.name}`}
            actions={[
              {
                key: "open",
                label: canEdit(role)
                  ? "Edit permissions"
                  : "View permissions",
                icon: canEdit(role)
                  ? "✎"
                  : "👁",
                onSelect: () =>
                  openRoleForm(role),
              },
              ...(canDelete(role)
                ? [
                    {
                      key: "delete",
                      label: "Delete",
                      icon: "🗑",
                      tone: "danger" as const,
                      dividerBefore: true,
                      onSelect: () =>
                        setRoleToDelete(role),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <p className="mt-3 flex-1 text-sm text-muted">
          {role.description ||
            "No description."}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#1266B1]/10 pt-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[1px] text-muted">
              Admin users
            </dt>

            <dd className="mt-1 font-medium text-ink">
              {role.userCount}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-[1px] text-muted">
              Permissions
            </dt>

            <dd className="mt-1 font-medium text-ink">
              {role.locked
                ? "All, always"
                : `${role.permissions.length} of ${totalPermissions}`}
            </dd>
          </div>
        </dl>

        {allowed.delete &&
          !canDelete(role) &&
          deleteBlockedReason &&
          !role.locked && (
            <p className="mt-3 text-xs text-muted">
              {deleteBlockedReason}
            </p>
          )}
      </article>
    );
  };

  // ============================
  // PERMISSION GRID
  // ============================

  const renderGrid = () => {
    if (!catalog) {
      return null;
    }

    const lockedAll = openRole?.locked;

    return (
      <div className="overflow-x-auto rounded-2xl border border-[#1266B1]/10">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-soft text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">
                Page
              </th>

              {catalog.actions.map((action) => {
                const cells =
                  columnCells(action);

                return (
                  <th
                    key={action}
                    className="w-24 px-2 py-3 text-center font-medium text-ink"
                  >
                    <label className="flex cursor-pointer flex-col items-center gap-1">
                      {ACTION_LABELS[action]}

                      {!readOnly && (
                        <input
                          type="checkbox"
                          className={checkboxClass}
                          aria-label={`${ACTION_LABELS[action]} on every page`}
                          checked={allChecked(
                            cells
                          )}
                          onChange={(e) =>
                            toggleMany(
                              cells,
                              e.target.checked
                            )
                          }
                        />
                      )}
                    </label>
                  </th>
                );
              })}

              {!readOnly && (
                <th className="w-16 px-2 py-3 text-center font-medium text-ink">
                  All
                </th>
              )}
            </tr>
          </thead>

          {groupResources(
            catalog.resources
          ).map(([group, resources]) => (
            <tbody key={group}>
              <tr>
                <th
                  colSpan={
                    catalog.actions.length +
                    (readOnly ? 1 : 2)
                  }
                  className="bg-surface px-4 pb-1 pt-4 text-left text-xs font-normal uppercase tracking-[2px] text-[#1266B1]"
                >
                  {group}
                </th>
              </tr>

              {resources.map((resource) => {
                const cells =
                  rowCells(resource);

                return (
                  <tr
                    key={resource.key}
                    className="border-t border-[#1266B1]/5"
                  >
                    <td className="px-4 py-2.5 text-ink">
                      {resource.label}
                    </td>

                    {catalog.actions.map(
                      (action) => {
                        if (
                          !resource.actions.includes(
                            action
                          )
                        ) {
                          return (
                            <td
                              key={action}
                              className="px-2 py-2.5 text-center text-muted"
                              title="Not available for this page"
                            >
                              —
                            </td>
                          );
                        }

                        const permission =
                          permissionOf(
                            resource.key,
                            action
                          );

                        return (
                          <td
                            key={action}
                            className="px-2 py-2.5 text-center"
                          >
                            <input
                              type="checkbox"
                              className={
                                checkboxClass
                              }
                              aria-label={`${resource.label}: ${ACTION_LABELS[action]}`}
                              checked={
                                lockedAll ||
                                form.permissions.includes(
                                  permission
                                )
                              }
                              disabled={
                                !canToggle(
                                  permission
                                )
                              }
                              title={
                                !readOnly &&
                                !canToggle(
                                  permission
                                )
                                  ? "You cannot grant a permission you do not have"
                                  : undefined
                              }
                              onChange={(e) =>
                                togglePermission(
                                  resource,
                                  action,
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                        );
                      }
                    )}

                    {!readOnly && (
                      <td className="px-2 py-2.5 text-center">
                        <input
                          type="checkbox"
                          className={
                            checkboxClass
                          }
                          aria-label={`Every action on ${resource.label}`}
                          checked={allChecked(
                            cells
                          )}
                          onChange={(e) =>
                            toggleMany(
                              cells,
                              e.target.checked
                            )
                          }
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    );
  };

  // ============================
  // UI
  // ============================

  const dialogTitle = openRole
    ? readOnly
      ? openRole.name
      : `Edit ${openRole.name}`
    : "Add Role";

  const dialogDescription = openRole?.locked
    ? "Super Admin always has every permission, including pages added later. It cannot be edited."
    : openRole && isOwnRole(openRole) && !isSuperAdmin
      ? "This is your own role. Ask a super admin to change it."
      : openRole && readOnly
        ? "You can view this role but not change it."
        : "Tick what this role may do on each page. Create, update and delete include view.";

  return (
    <div>
      {/* HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[3px] text-[#1266B1]">
            Management
          </p>

          <h1 className="mt-2 font-display text-4xl text-[#1266B1] md:text-5xl">
            Roles & Permissions
          </h1>

          <p className="mt-2 text-muted">
            What each admin user can see and
            change. Assign roles on the Admin
            Users page.
          </p>
        </div>

        {allowed.create && (
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-full bg-[#1266B1] px-8 py-3 text-xs uppercase tracking-[2px] text-white transition hover:bg-[#0e5698]"
          >
            Add Role
          </button>
        )}
      </div>

      {/* ROLES */}

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-3 rounded-3xl bg-surface py-14 text-muted shadow-sm">
          <LoadingSpinner size="sm" />
          Loading roles...
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map(renderCard)}
        </div>
      )}

      {/* ============================ */}
      {/* ADD / EDIT / VIEW            */}
      {/* ============================ */}

      <DialogBox
        open={formOpen}
        onClose={closeForm}
        eyebrow="Roles & Permissions"
        title={dialogTitle}
        description={dialogDescription}
        size="xl"
        onSubmit={
          readOnly ? undefined : handleSubmit
        }
        submitting={saving}
        submittingLabel={
          openRole ? "Updating..." : "Adding..."
        }
        confirmLabel={
          openRole ? "Update Role" : "Add Role"
        }
        cancelLabel={
          readOnly ? "Close" : "Cancel"
        }
        closeOnBackdrop={readOnly}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" required>
            <input
              required
              maxLength={60}
              value={form.name}
              disabled={readOnly}
              onChange={(e) =>
                setForm((previous) => ({
                  ...previous,
                  name: e.target.value,
                }))
              }
              className={inputClass}
              placeholder="e.g. Front Desk"
            />
          </FormField>

          <FormField label="Description">
            <input
              maxLength={300}
              value={form.description}
              disabled={readOnly}
              onChange={(e) =>
                setForm((previous) => ({
                  ...previous,
                  description: e.target.value,
                }))
              }
              className={inputClass}
              placeholder="Who this role is for"
            />
          </FormField>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-ink">
              Permissions
            </p>

            <p className="text-xs text-muted">
              {openRole?.locked
                ? "All, always"
                : `${form.permissions.length} of ${totalPermissions} selected`}
            </p>
          </div>

          {renderGrid()}
        </div>
      </DialogBox>

      {/* ============================ */}
      {/* DELETE CONFIRMATION          */}
      {/* ============================ */}

      <DialogBox
        open={Boolean(roleToDelete)}
        onClose={() => setRoleToDelete(null)}
        eyebrow="Confirm"
        title="Delete role?"
        description={
          roleToDelete
            ? `The ${roleToDelete.name} role will be removed. This cannot be undone.`
            : undefined
        }
        size="sm"
        destructive
        confirmLabel="Delete"
        submittingLabel="Deleting..."
        submitting={deleting}
        onConfirm={confirmDelete}
      >
        <p className="text-sm text-muted">
          No admin user holds this role.
        </p>
      </DialogBox>
    </div>
  );
}
