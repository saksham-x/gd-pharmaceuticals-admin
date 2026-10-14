import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import CustomTable, {
  type TableColumn,
} from "../../components/CustomTable";

import DialogBox from "../../components/DialogBox";

import FormField from "../../components/FormField";

import PasswordInput from "../../components/PasswordInput";

import RowActionsMenu from "../../components/RowActionsMenu";

import {
  useAdminSession,
  usePermissions,
} from "../../hooks/useAuth";

import {
  SUPER_ADMIN_ROLE,
  type AdminRole,
} from "../../services/auth/auth.types";

import { getApiErrorMessage } from "../../services/base/api";

import {
  changeAdminUserPassword,
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "../../services/adminUser/adminUserService";

import type {
  AdminUser,
  AdminUserPayload,
} from "../../services/adminUser/adminUser.types";

import { getRoles } from "../../services/role/roleService";

import type { Role } from "../../services/role/role.types";

import {
  email,
  maxLength,
  minLength,
  required,
  validate,
} from "../../utils/validation";

// ========================================
// FORM DEFAULTS
// ========================================

const EMPTY_FORM: AdminUserPayload = {
  name: "",
  email: "",
  role: "staff",
  password: "",
};

// ========================================
// SHARED INPUT STYLE
// ========================================

const inputClass =
  "w-full rounded-xl border border-[#1266B1]/20 bg-soft px-4 py-3 text-sm outline-none focus:border-[#1266B1] disabled:cursor-not-allowed disabled:opacity-60";

export default function UsersAdmin() {
  const session = useAdminSession();

  const allowed =
    usePermissions("adminUsers");

  const canManage = allowed.view;

  // Its own permission, apart from
  // adminUsers.update.
  const canChangePassword =
    usePermissions("adminPasswords").update;

  const currentUserId = session?.id;

  const isSuperAdmin =
    session?.role === SUPER_ADMIN_ROLE;

  // Every role, for the role picker and
  // the badges.
  const [roles, setRoles] = useState<
    Role[]
  >([]);

  const [users, setUsers] = useState<
    AdminUser[]
  >([]);

  const [loading, setLoading] =
    useState(canManage);

  const [form, setForm] =
    useState<AdminUserPayload>(EMPTY_FORM);

  const [formOpen, setFormOpen] =
    useState(false);

  // Null while adding a new user.
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  // The user awaiting delete
  // confirmation. Null means the dialog
  // is closed.
  const [userToDelete, setUserToDelete] =
    useState<AdminUser | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  // The user whose password is being
  // changed. Null means the dialog is
  // closed.
  const [
    userForPassword,
    setUserForPassword,
  ] = useState<AdminUser | null>(null);

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const editingSelf =
    editingId !== null &&
    editingId === currentUserId;

  const roleName = (key: AdminRole) =>
    roles.find((role) => role.key === key)
      ?.name ?? key;

  // Only a super admin hands out Super
  // Admin, and nobody hands out a role
  // with more access than their own. The
  // API refuses both; this keeps them out
  // of the picker.
  const assignableRoles = roles.filter(
    (role) =>
      isSuperAdmin ||
      (!role.locked &&
        role.permissions.every((permission) =>
          session?.permissions.includes(
            permission
          )
        ))
  );

  // The role being edited stays listed even
  // when it is not assignable, so the
  // picker never shows a blank.
  const roleOptions =
    assignableRoles.some(
      (role) => role.key === form.role
    ) || !form.role
      ? assignableRoles
      : [
          ...roles.filter(
            (role) => role.key === form.role
          ),
          ...assignableRoles,
        ];

  // Super admin accounts are managed by
  // super admins only.
  const canTouch = (user: AdminUser) =>
    isSuperAdmin ||
    user.role !== SUPER_ADMIN_ROLE;

  // ============================
  // FETCH
  // ============================

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const [userList, roleList] =
        await Promise.all([
          getAdminUsers(),
          getRoles(),
        ]);

      setUsers(userList);
      setRoles(roleList);
    } catch (error) {
      console.error(
        "Fetch users error:",
        error
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Failed to load admin users"
        )
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      fetchUsers();
    }
  }, [canManage]);

  // ============================
  // FORM
  // ============================

  const openAddForm = () => {
    // Staff when the picker has it,
    // otherwise its first role.
    const defaultRole =
      assignableRoles.find(
        (role) => role.key === "staff"
      )?.key ??
      assignableRoles[0]?.key ??
      "";

    setForm({
      ...EMPTY_FORM,
      role: defaultRole,
    });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (user: AdminUser) => {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });

    setEditingId(user._id);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const updateField = <
    K extends keyof AdminUserPayload,
  >(
    field: K,
    value: AdminUserPayload[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ============================
  // SAVE
  // ============================

  const handleSubmit = async () => {
    const error = validate(form, {
      name: ["Name", [required()]],
      email: ["Email", [required(), email()]],
      role: ["Role", [required()]],
      // Set on create only; editing has
      // its own Change Password action.
      ...(editingId
        ? {}
        : {
            password: [
              "Password",
              [
                required(),
                minLength(8),
                maxLength(128),
              ],
            ],
          }),
    });

    if (error) {
      toast.error(error);

      return;
    }

    const payload: AdminUserPayload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
    };

    try {
      setSaving(true);

      if (editingId) {
        const { password: _password, ...changes } =
          payload;

        await updateAdminUser(
          editingId,
          changes
        );

        toast.success(
          "Admin user updated successfully!"
        );
      } else {
        await createAdminUser(payload);

        toast.success(
          "Admin user added successfully!"
        );
      }

      closeForm();

      await fetchUsers();
    } catch (error) {
      console.error(
        "Save user error:",
        error
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to save the admin user"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // DELETE
  //
  // Asking happens in the dialog; this
  // only runs once the admin confirms.
  // ============================

  const confirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteAdminUser(
        userToDelete._id
      );

      toast.success(
        "Admin user deleted successfully!"
      );

      setUserToDelete(null);

      await fetchUsers();
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to delete the admin user"
        )
      );

      // Dialog stays open so the admin can
      // retry.
    } finally {
      setDeleting(false);
    }
  };

  // ============================
  // CHANGE PASSWORD
  // ============================

  const openPasswordForm = (
    user: AdminUser
  ) => {
    setNewPassword("");
    setConfirmPassword("");
    setUserForPassword(user);
  };

  const closePasswordForm = () => {
    setUserForPassword(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const submitPasswordChange = async () => {
    if (!userForPassword) {
      return;
    }

    const error = validate(
      { password: newPassword },
      {
        password: [
          "Password",
          [
            required(),
            minLength(8),
            maxLength(128),
          ],
        ],
      }
    );

    if (error) {
      toast.error(error);

      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");

      return;
    }

    try {
      setChangingPassword(true);

      await changeAdminUserPassword(
        userForPassword._id,
        newPassword
      );

      toast.success(
        `Password changed for ${userForPassword.name}`
      );

      closePasswordForm();
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to change the password"
        )
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================
  // ROW PIECES
  // ============================

  const roleBadge = (user: AdminUser) => (
    <span
      className={`inline-block rounded-full px-4 py-1 text-xs uppercase tracking-[1px] ${
        user.role === SUPER_ADMIN_ROLE
          ? "bg-[#1266B1] text-white"
          : user.role === "admin"
            ? "bg-blush text-[#1266B1]"
            : "bg-soft text-muted"
      }`}
    >
      {roleName(user.role)}
    </span>
  );

  const nameCell = (user: AdminUser) => (
    <span className="font-medium text-ink">
      {user.name}

      {user._id === currentUserId && (
        <span className="ml-2 text-xs font-normal text-muted">
          (you)
        </span>
      )}
    </span>
  );

  const renderActions = (user: AdminUser) => (
    <RowActionsMenu
      label={`Actions for ${user.name}`}
      actions={[
        ...(allowed.update && canTouch(user)
          ? [
              {
                key: "edit",
                label: "Edit",
                icon: "✎",
                onSelect: () =>
                  openEditForm(user),
              },
            ]
          : []),
        ...(canChangePassword && canTouch(user)
          ? [
              {
                key: "password",
                label: "Change Password",
                icon: "🔑",
                onSelect: () =>
                  openPasswordForm(user),
              },
            ]
          : []),
        // The API refuses deleting
        // yourself; hiding it saves the
        // round trip.
        ...(!allowed.delete ||
        !canTouch(user) ||
        user._id === currentUserId
          ? []
          : [
              {
                key: "delete",
                label: "Delete",
                icon: "🗑",
                tone: "danger" as const,
                dividerBefore: true,
                onSelect: () =>
                  setUserToDelete(user),
              },
            ]),
      ]}
    />
  );

  // ============================
  // COLUMNS
  // ============================

  const columns: TableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      hideOnMobile: true,
      render: nameCell,
    },
    {
      key: "email",
      header: "Email",
      cellClassName: "break-all",
      render: (user) => user.email,
    },
    {
      key: "role",
      header: "Role",
      width: "130px",
      hideOnMobile: true,
      render: roleBadge,
    },
    {
      key: "created",
      header: "Added",
      width: "140px",
      cellClassName:
        "whitespace-nowrap text-sm text-muted",
      render: (user) =>
        user.createdAt
          ? new Date(
              user.createdAt
            ).toLocaleDateString()
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "90px",
      hideOnMobile: true,
      render: renderActions,
    },
  ];

  // ============================
  // UI
  // ============================

  if (!canManage) {
    return (
      <div className="rounded-3xl bg-surface px-6 py-14 text-center shadow-sm">
        <p className="font-medium text-ink">
          You cannot manage admin users
        </p>

        <p className="mt-2 text-sm text-muted">
          Ask a super admin if you need an
          account added or changed.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[3px] text-[#1266B1]">
            Management
          </p>

          <h1 className="mt-2 font-display text-4xl text-[#1266B1] md:text-5xl">
            Admin Users
          </h1>

          <p className="mt-2 text-muted">
            People who can sign in to this admin
            panel.
          </p>
        </div>

        {allowed.create && (
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-full bg-[#1266B1] px-8 py-3 text-xs uppercase tracking-[2px] text-white transition hover:bg-[#0e5698]"
          >
            Add Admin User
          </button>
        )}
      </div>

      {/* TABLE */}

      <CustomTable
        className="mt-10"
        columns={columns}
        rows={users}
        rowKey={(user) => user._id}
        loading={loading}
        loadingMessage="Loading users..."
        emptyIcon="☺"
        emptyTitle="No admin users yet"
        emptyMessage="Add your first admin user using the button above."
        minWidth="900px"
        mobileTitle={nameCell}
        mobileBadge={roleBadge}
        mobileActions={renderActions}
      />

      {/* ============================ */}
      {/* ADD / EDIT                   */}
      {/* ============================ */}

      <DialogBox
        open={formOpen}
        onClose={closeForm}
        eyebrow="Management"
        title={
          editingId ? "Edit Admin User" : "Add Admin User"
        }
        size="lg"
        onSubmit={handleSubmit}
        submitting={saving}
        submittingLabel={
          editingId
            ? "Updating..."
            : "Adding..."
        }
        confirmLabel={
          editingId
            ? "Update Admin User"
            : "Add Admin User"
        }
        // A half filled form should not
        // vanish on a stray click.
        closeOnBackdrop={false}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" required>
            <input
              required
              value={form.name}
              onChange={(e) =>
                updateField(
                  "name",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Email" required>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                updateField(
                  "email",
                  e.target.value
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Role"
            required
            hint={
              editingSelf
                ? "you cannot change your own role"
                : undefined
            }
          >
            <select
              required
              value={form.role}
              disabled={editingSelf}
              onChange={(e) =>
                updateField(
                  "role",
                  e.target.value as AdminRole
                )
              }
              className={inputClass}
            >
              {roleOptions.length === 0 && (
                <option value="">
                  No roles you can assign
                </option>
              )}

              {roleOptions.map((role) => (
                <option
                  key={role.key}
                  value={role.key}
                >
                  {role.name}
                  {role.description
                    ? ` — ${role.description}`
                    : ""}
                </option>
              ))}
            </select>
          </FormField>

          {/* Editing changes the password
              through Change Password. */}
          {!editingId && (
            <FormField
              label="Password"
              required
              hint="at least 8 characters"
            >
              <PasswordInput
                required
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={form.password}
                onChange={(e) =>
                  updateField(
                    "password",
                    e.target.value
                  )
                }
                className={`${inputClass} pr-12`}
              />
            </FormField>
          )}
        </div>
      </DialogBox>

      {/* ============================ */}
      {/* CHANGE PASSWORD              */}
      {/* ============================ */}

      <DialogBox
        open={Boolean(userForPassword)}
        onClose={closePasswordForm}
        eyebrow="Management"
        title="Change Password"
        description={
          userForPassword
            ? `Set a new password for ${userForPassword.name} (${userForPassword.email}).`
            : undefined
        }
        size="md"
        onSubmit={submitPasswordChange}
        submitting={changingPassword}
        submittingLabel="Saving..."
        confirmLabel="Change Password"
        closeOnBackdrop={false}
      >
        <div className="grid gap-4">
          <FormField
            label="New Password"
            required
            hint="at least 8 characters"
          >
            <PasswordInput
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              className={`${inputClass} pr-12`}
            />
          </FormField>

          <FormField
            label="Confirm Password"
            required
          >
            <PasswordInput
              required
              autoComplete="new-password"
              maxLength={128}
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              className={`${inputClass} pr-12`}
            />
          </FormField>
        </div>
      </DialogBox>

      {/* ============================ */}
      {/* DELETE CONFIRMATION          */}
      {/* ============================ */}

      <DialogBox
        open={Boolean(userToDelete)}
        onClose={() =>
          setUserToDelete(null)
        }
        eyebrow="Confirm"
        title="Delete admin user?"
        description={
          userToDelete
            ? `${userToDelete.name} will no longer be able to sign in. This cannot be undone.`
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
          They are signed out on their next
          request.
        </p>
      </DialogBox>
    </div>
  );
}
